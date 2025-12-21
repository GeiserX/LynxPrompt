/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ClickHouse Analytics Client for LynxPrompt
 *
 * This module handles all analytics event tracking using ClickHouse.
 * Events are batched and sent asynchronously to minimize performance impact.
 *
 * Data tracked (all privacy-respecting, no PII):
 * - Page views
 * - Template interactions (view, download, favorite)
 * - Search queries (anonymized)
 * - Wizard funnel progression
 * - Feature usage
 * - Errors
 */

// Event types we track
export type AnalyticsEventType =
  | "page_view"
  | "template_view"
  | "template_download"
  | "template_favorite"
  | "template_search"
  | "wizard_step"
  | "wizard_complete"
  | "wizard_abandon"
  | "feature_use"
  | "error";

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  timestamp?: Date;
  session_id?: string;
  user_id?: string; // Hashed, not actual user ID
  // Page/route info
  page_path?: string;
  referrer?: string;
  // Template info
  template_id?: string;
  template_name?: string;
  template_category?: string;
  platform?: string;
  // Search info
  search_query?: string;
  search_results_count?: number;
  // Wizard info
  wizard_step?: string;
  wizard_step_number?: number;
  // Feature info
  feature_name?: string;
  // Error info
  error_message?: string;
  error_stack?: string;
  // Context
  user_agent?: string;
  country?: string;
  // Custom properties
  properties?: Record<string, string | number | boolean>;
}

// ClickHouse connection config
const CLICKHOUSE_CONFIG = {
  host: process.env.CLICKHOUSE_HOST || "localhost",
  port: process.env.CLICKHOUSE_PORT || "8123",
  database: process.env.CLICKHOUSE_DB || "lynxprompt_analytics",
  user: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
};

// Check if analytics is enabled
const isAnalyticsEnabled = () => {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.CLICKHOUSE_HOST &&
    process.env.CLICKHOUSE_PASSWORD
  );
};

// Event buffer for batching
let eventBuffer: AnalyticsEvent[] = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

// Flush timer
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Initialize ClickHouse tables (run once on startup)
 */
export async function initializeClickHouse(): Promise<void> {
  if (!isAnalyticsEnabled()) {
    console.log("ClickHouse analytics disabled (missing config)");
    return;
  }

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS events (
      event_id UUID DEFAULT generateUUIDv4(),
      event_type LowCardinality(String),
      timestamp DateTime64(3) DEFAULT now64(3),
      session_id String,
      user_id String,
      page_path String,
      referrer String,
      template_id String,
      template_name String,
      template_category LowCardinality(String),
      platform LowCardinality(String),
      search_query String,
      search_results_count UInt32,
      wizard_step LowCardinality(String),
      wizard_step_number UInt8,
      feature_name LowCardinality(String),
      error_message String,
      user_agent String,
      country LowCardinality(String),
      properties String -- JSON string for flexible properties
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(timestamp)
    ORDER BY (event_type, timestamp)
    TTL timestamp + INTERVAL 1 YEAR
    SETTINGS index_granularity = 8192
  `;

  try {
    await executeQuery(createTableSQL);
    console.log("ClickHouse events table initialized");

    // Create materialized views for common queries
    await createMaterializedViews();
  } catch (error) {
    console.error("Failed to initialize ClickHouse:", error);
  }
}

/**
 * Create materialized views for fast analytics queries
 */
async function createMaterializedViews(): Promise<void> {
  // Daily template stats
  const dailyTemplateStats = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_template_stats
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(date)
    ORDER BY (date, template_id, event_type)
    AS SELECT
      toDate(timestamp) as date,
      template_id,
      event_type,
      count() as count
    FROM events
    WHERE template_id != '' AND event_type IN ('template_view', 'template_download', 'template_favorite')
    GROUP BY date, template_id, event_type
  `;

  // Hourly platform usage
  const hourlyPlatformStats = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hourly_platform_stats
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(hour)
    ORDER BY (hour, platform)
    AS SELECT
      toStartOfHour(timestamp) as hour,
      platform,
      count() as downloads
    FROM events
    WHERE event_type = 'template_download' AND platform != ''
    GROUP BY hour, platform
  `;

  // Search query aggregation
  const searchQueryStats = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_search_queries
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(date)
    ORDER BY (date, search_query)
    AS SELECT
      toDate(timestamp) as date,
      lower(search_query) as search_query,
      count() as count,
      avg(search_results_count) as avg_results
    FROM events
    WHERE event_type = 'template_search' AND search_query != ''
    GROUP BY date, search_query
  `;

  // Wizard funnel
  const wizardFunnel = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_wizard_funnel
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(date)
    ORDER BY (date, wizard_step_number)
    AS SELECT
      toDate(timestamp) as date,
      wizard_step,
      wizard_step_number,
      count() as count
    FROM events
    WHERE event_type = 'wizard_step'
    GROUP BY date, wizard_step, wizard_step_number
  `;

  try {
    await executeQuery(dailyTemplateStats);
    await executeQuery(hourlyPlatformStats);
    await executeQuery(searchQueryStats);
    await executeQuery(wizardFunnel);
    console.log("ClickHouse materialized views created");
  } catch (error) {
    // Views might already exist, that's OK
    console.log("Materialized views setup complete");
  }
}

/**
 * Execute a ClickHouse query
 */
async function executeQuery(query: string): Promise<string> {
  const url = `http://${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port}/?database=${CLICKHOUSE_CONFIG.database}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-ClickHouse-User": CLICKHOUSE_CONFIG.user,
      "X-ClickHouse-Key": CLICKHOUSE_CONFIG.password,
      "Content-Type": "text/plain",
    },
    body: query,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickHouse query failed: ${error}`);
  }

  return response.text();
}

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!isAnalyticsEnabled()) return;

  // Add timestamp if not provided
  event.timestamp = event.timestamp || new Date();

  // Add to buffer
  eventBuffer.push(event);

  // Flush if buffer is full
  if (eventBuffer.length >= BATCH_SIZE) {
    flushEvents();
  }

  // Set up flush timer if not already running
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushEvents();
      flushTimer = null;
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush buffered events to ClickHouse
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const eventsToFlush = [...eventBuffer];
  eventBuffer = [];

  // Clear timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    // Build INSERT query
    const values = eventsToFlush
      .map((e) => {
        return `(
          '${e.event_type}',
          '${e.timestamp?.toISOString() || new Date().toISOString()}',
          '${e.session_id || ""}',
          '${e.user_id || ""}',
          '${escapeSql(e.page_path || "")}',
          '${escapeSql(e.referrer || "")}',
          '${e.template_id || ""}',
          '${escapeSql(e.template_name || "")}',
          '${e.template_category || ""}',
          '${e.platform || ""}',
          '${escapeSql(e.search_query || "")}',
          ${e.search_results_count || 0},
          '${e.wizard_step || ""}',
          ${e.wizard_step_number || 0},
          '${e.feature_name || ""}',
          '${escapeSql(e.error_message || "")}',
          '${escapeSql(e.user_agent || "")}',
          '${e.country || ""}',
          '${e.properties ? JSON.stringify(e.properties) : "{}"}'
        )`;
      })
      .join(",");

    const insertSQL = `
      INSERT INTO events (
        event_type, timestamp, session_id, user_id, page_path, referrer,
        template_id, template_name, template_category, platform,
        search_query, search_results_count, wizard_step, wizard_step_number,
        feature_name, error_message, user_agent, country, properties
      ) VALUES ${values}
    `;

    await executeQuery(insertSQL);
  } catch (error) {
    console.error("Failed to flush analytics events:", error);
    // Put events back in buffer for retry (limit to prevent memory issues)
    if (eventBuffer.length < 100) {
      eventBuffer = [...eventsToFlush, ...eventBuffer];
    }
  }
}

/**
 * Escape SQL string
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\\/g, "\\\\").slice(0, 1000);
}

// =============================================================================
// QUERY HELPERS - For retrieving analytics data
// =============================================================================

/**
 * Get trending templates (most viewed/downloaded in last N days)
 */
export async function getTrendingTemplates(
  days: number = 7,
  limit: number = 10
): Promise<Array<{ template_id: string; views: number; downloads: number }>> {
  if (!isAnalyticsEnabled()) return [];

  const query = `
    SELECT
      template_id,
      countIf(event_type = 'template_view') as views,
      countIf(event_type = 'template_download') as downloads
    FROM events
    WHERE
      template_id != ''
      AND timestamp >= now() - INTERVAL ${days} DAY
      AND event_type IN ('template_view', 'template_download')
    GROUP BY template_id
    ORDER BY downloads DESC, views DESC
    LIMIT ${limit}
    FORMAT JSON
  `;

  try {
    const result = await executeQuery(query);
    const parsed = JSON.parse(result);
    return parsed.data || [];
  } catch {
    return [];
  }
}

/**
 * Get popular search queries
 */
export async function getPopularSearches(
  days: number = 30,
  limit: number = 20
): Promise<Array<{ query: string; count: number }>> {
  if (!isAnalyticsEnabled()) return [];

  const query = `
    SELECT
      lower(search_query) as query,
      count() as count
    FROM events
    WHERE
      event_type = 'template_search'
      AND search_query != ''
      AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY query
    ORDER BY count DESC
    LIMIT ${limit}
    FORMAT JSON
  `;

  try {
    const result = await executeQuery(query);
    const parsed = JSON.parse(result);
    return parsed.data || [];
  } catch {
    return [];
  }
}

/**
 * Get platform distribution
 */
export async function getPlatformStats(
  days: number = 30
): Promise<Array<{ platform: string; downloads: number; percentage: number }>> {
  if (!isAnalyticsEnabled()) return [];

  const query = `
    SELECT
      platform,
      count() as downloads,
      round(count() * 100.0 / sum(count()) OVER (), 2) as percentage
    FROM events
    WHERE
      event_type = 'template_download'
      AND platform != ''
      AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY platform
    ORDER BY downloads DESC
    FORMAT JSON
  `;

  try {
    const result = await executeQuery(query);
    const parsed = JSON.parse(result);
    return parsed.data || [];
  } catch {
    return [];
  }
}

/**
 * Get wizard funnel drop-off rates
 */
export async function getWizardFunnel(days: number = 30): Promise<
  Array<{
    step: string;
    step_number: number;
    count: number;
    drop_off_rate: number;
  }>
> {
  if (!isAnalyticsEnabled()) return [];

  const query = `
    WITH funnel AS (
      SELECT
        wizard_step as step,
        wizard_step_number as step_number,
        count() as count
      FROM events
      WHERE
        event_type = 'wizard_step'
        AND timestamp >= now() - INTERVAL ${days} DAY
      GROUP BY wizard_step, wizard_step_number
      ORDER BY wizard_step_number
    )
    SELECT
      step,
      step_number,
      count,
      round((1 - count / lagInFrame(count, 1, count) OVER (ORDER BY step_number)) * 100, 2) as drop_off_rate
    FROM funnel
    FORMAT JSON
  `;

  try {
    const result = await executeQuery(query);
    const parsed = JSON.parse(result);
    return parsed.data || [];
  } catch {
    return [];
  }
}

// Export for server-side initialization
export { isAnalyticsEnabled };

