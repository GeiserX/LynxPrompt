import type { DatabaseOption } from "./types.js";

/**
 * All supported databases
 * This is the single source of truth - both CLI and WebUI import from here
 */
export const DATABASES: DatabaseOption[] = [
  // === OPEN SOURCE RELATIONAL ===
  { id: "postgresql", label: "PostgreSQL", icon: "🐘", category: "opensource" },
  { id: "mysql", label: "MySQL", icon: "🐬", category: "opensource" },
  { id: "mariadb", label: "MariaDB", icon: "🦭", category: "opensource" },
  { id: "sqlite", label: "SQLite", icon: "📦", category: "opensource" },
  { id: "cockroachdb", label: "CockroachDB", icon: "🪳", category: "opensource" },
  { id: "yugabytedb", label: "YugabyteDB", icon: "🔵", category: "opensource" },
  { id: "tidb", label: "TiDB", icon: "⚡", category: "opensource" },
  { id: "vitess", label: "Vitess", icon: "🟢", category: "opensource" },
  // === OPEN SOURCE NOSQL - Document ===
  { id: "mongodb", label: "MongoDB", icon: "🍃", category: "opensource" },
  { id: "couchdb", label: "CouchDB", icon: "🛋️", category: "opensource" },
  { id: "arangodb", label: "ArangoDB", icon: "🥑", category: "opensource" },
  { id: "ferretdb", label: "FerretDB", icon: "🐻", category: "opensource" },
  { id: "pouchdb", label: "PouchDB", icon: "📱", category: "opensource" },
  // === OPEN SOURCE NOSQL - Key-Value ===
  { id: "redis", label: "Redis", icon: "🔴", category: "opensource" },
  { id: "valkey", label: "Valkey", icon: "🔑", category: "opensource" },
  { id: "keydb", label: "KeyDB", icon: "🗝️", category: "opensource" },
  { id: "dragonfly", label: "Dragonfly", icon: "🐉", category: "opensource" },
  { id: "memcached", label: "Memcached", icon: "💾", category: "opensource" },
  { id: "etcd", label: "etcd", icon: "🔧", category: "opensource" },
  // === OPEN SOURCE NOSQL - Wide Column ===
  { id: "cassandra", label: "Apache Cassandra", icon: "👁️", category: "opensource" },
  { id: "scylladb", label: "ScyllaDB", icon: "🦂", category: "opensource" },
  { id: "hbase", label: "Apache HBase", icon: "🐘", category: "opensource" },
  // === OPEN SOURCE NOSQL - Graph ===
  { id: "neo4j", label: "Neo4j", icon: "🔗", category: "opensource" },
  { id: "dgraph", label: "Dgraph", icon: "📊", category: "opensource" },
  { id: "janusgraph", label: "JanusGraph", icon: "🪐", category: "opensource" },
  { id: "agensgraph", label: "AgensGraph", icon: "🌐", category: "opensource" },
  // === OPEN SOURCE - Time Series ===
  { id: "timescaledb", label: "TimescaleDB", icon: "⏱️", category: "opensource" },
  { id: "influxdb", label: "InfluxDB", icon: "📈", category: "opensource" },
  { id: "questdb", label: "QuestDB", icon: "🏎️", category: "opensource" },
  { id: "victoriametrics", label: "VictoriaMetrics", icon: "📊", category: "opensource" },
  { id: "prometheus", label: "Prometheus", icon: "🔥", category: "opensource" },
  // === OPEN SOURCE - Analytics/OLAP ===
  { id: "clickhouse", label: "ClickHouse", icon: "🏠", category: "opensource" },
  { id: "apache_druid", label: "Apache Druid", icon: "🧙", category: "opensource" },
  { id: "apache_pinot", label: "Apache Pinot", icon: "🎯", category: "opensource" },
  { id: "duckdb", label: "DuckDB", icon: "🦆", category: "opensource" },
  { id: "starrocks", label: "StarRocks", icon: "⭐", category: "opensource" },
  // === OPEN SOURCE - Search ===
  { id: "elasticsearch", label: "Elasticsearch", icon: "🔍", category: "opensource" },
  { id: "opensearch", label: "OpenSearch", icon: "🔎", category: "opensource" },
  { id: "meilisearch", label: "Meilisearch", icon: "⚡", category: "opensource" },
  { id: "typesense", label: "Typesense", icon: "🔤", category: "opensource" },
  { id: "solr", label: "Apache Solr", icon: "☀️", category: "opensource" },
  { id: "zinc", label: "Zinc", icon: "🔬", category: "opensource" },
  // === OPEN SOURCE - Vector/AI ===
  { id: "milvus", label: "Milvus", icon: "🧠", category: "opensource" },
  { id: "weaviate", label: "Weaviate", icon: "🕸️", category: "opensource" },
  { id: "qdrant", label: "Qdrant", icon: "🎯", category: "opensource" },
  { id: "chroma", label: "Chroma", icon: "🎨", category: "opensource" },
  { id: "pgvector", label: "pgvector", icon: "🐘", category: "opensource" },
  // === OPEN SOURCE - Message Queues (often used as DBs) ===
  { id: "kafka", label: "Apache Kafka", icon: "📨", category: "opensource" },
  { id: "rabbitmq", label: "RabbitMQ", icon: "🐰", category: "opensource" },
  { id: "nats", label: "NATS", icon: "📬", category: "opensource" },
  { id: "pulsar", label: "Apache Pulsar", icon: "💫", category: "opensource" },
  { id: "redpanda", label: "Redpanda", icon: "🐼", category: "opensource" },
  // === OPEN SOURCE - Embedded/Edge ===
  { id: "leveldb", label: "LevelDB", icon: "📚", category: "opensource" },
  { id: "rocksdb", label: "RocksDB", icon: "🪨", category: "opensource" },
  { id: "badger", label: "Badger", icon: "🦡", category: "opensource" },
  { id: "surrealdb", label: "SurrealDB", icon: "🌊", category: "opensource" },
  { id: "rqlite", label: "rqlite", icon: "📡", category: "opensource" },
  // === CLOUD MANAGED - AWS ===
  { id: "aws_rds", label: "AWS RDS", icon: "☁️", category: "cloud" },
  { id: "aws_aurora", label: "AWS Aurora", icon: "🌅", category: "cloud" },
  { id: "aws_dynamodb", label: "AWS DynamoDB", icon: "⚡", category: "cloud" },
  { id: "aws_redshift", label: "AWS Redshift", icon: "📊", category: "cloud" },
  { id: "aws_neptune", label: "AWS Neptune", icon: "🔱", category: "cloud" },
  { id: "aws_timestream", label: "AWS Timestream", icon: "⏰", category: "cloud" },
  { id: "aws_documentdb", label: "AWS DocumentDB", icon: "📄", category: "cloud" },
  { id: "aws_elasticache", label: "AWS ElastiCache", icon: "💨", category: "cloud" },
  { id: "aws_memorydb", label: "AWS MemoryDB", icon: "🧠", category: "cloud" },
  // === CLOUD MANAGED - GCP ===
  { id: "gcp_cloudsql", label: "GCP Cloud SQL", icon: "☁️", category: "cloud" },
  { id: "gcp_spanner", label: "GCP Cloud Spanner", icon: "🌐", category: "cloud" },
  { id: "gcp_firestore", label: "GCP Firestore", icon: "🔥", category: "cloud" },
  { id: "gcp_bigtable", label: "GCP Bigtable", icon: "📊", category: "cloud" },
  { id: "gcp_bigquery", label: "GCP BigQuery", icon: "📈", category: "cloud" },
  { id: "gcp_memorystore", label: "GCP Memorystore", icon: "💾", category: "cloud" },
  // === CLOUD MANAGED - Azure ===
  { id: "azure_sql", label: "Azure SQL", icon: "☁️", category: "cloud" },
  { id: "azure_cosmosdb", label: "Azure Cosmos DB", icon: "🌌", category: "cloud" },
  { id: "azure_synapse", label: "Azure Synapse", icon: "📊", category: "cloud" },
  { id: "azure_cache", label: "Azure Cache", icon: "💨", category: "cloud" },
  // === CLOUD MANAGED - Other ===
  { id: "supabase", label: "Supabase", icon: "⚡", category: "cloud" },
  { id: "firebase", label: "Firebase", icon: "🔥", category: "cloud" },
  { id: "planetscale", label: "PlanetScale", icon: "🪐", category: "cloud" },
  { id: "neon", label: "Neon", icon: "💡", category: "cloud" },
  { id: "turso", label: "Turso", icon: "🐦", category: "cloud" },
  { id: "xata", label: "Xata", icon: "⚡", category: "cloud" },
  { id: "upstash", label: "Upstash", icon: "🚀", category: "cloud" },
  { id: "fauna", label: "Fauna", icon: "🦎", category: "cloud" },
  { id: "mongodb_atlas", label: "MongoDB Atlas", icon: "🍃", category: "cloud" },
  { id: "datastax_astra", label: "DataStax Astra", icon: "✨", category: "cloud" },
  { id: "cockroach_cloud", label: "CockroachDB Cloud", icon: "🪳", category: "cloud" },
  { id: "timescale_cloud", label: "Timescale Cloud", icon: "⏱️", category: "cloud" },
  { id: "influx_cloud", label: "InfluxDB Cloud", icon: "📈", category: "cloud" },
  { id: "elastic_cloud", label: "Elastic Cloud", icon: "🔍", category: "cloud" },
  { id: "algolia", label: "Algolia", icon: "🔎", category: "cloud" },
  { id: "pinecone", label: "Pinecone", icon: "🌲", category: "cloud" },
  // === PROPRIETARY ===
  { id: "oracle", label: "Oracle Database", icon: "🔶", category: "proprietary" },
  { id: "mssql", label: "Microsoft SQL Server", icon: "🟦", category: "proprietary" },
  { id: "db2", label: "IBM Db2", icon: "🔷", category: "proprietary" },
  { id: "teradata", label: "Teradata", icon: "🟠", category: "proprietary" },
  { id: "sap_hana", label: "SAP HANA", icon: "🔵", category: "proprietary" },
  { id: "informix", label: "IBM Informix", icon: "📊", category: "proprietary" },
  { id: "sybase", label: "SAP ASE (Sybase)", icon: "🔷", category: "proprietary" },
  { id: "singlestore", label: "SingleStore", icon: "⚡", category: "proprietary" },
  { id: "marklogic", label: "MarkLogic", icon: "📁", category: "proprietary" },
  { id: "intersystems_cache", label: "InterSystems Caché", icon: "💎", category: "proprietary" },
];

/**
 * Get database IDs for filtering
 */
export const DATABASE_IDS = DATABASES.map(d => d.id);

/**
 * Get databases by category
 */
export const getDatabasesByCategory = (category: DatabaseOption["category"]) =>
  DATABASES.filter(d => d.category === category);



