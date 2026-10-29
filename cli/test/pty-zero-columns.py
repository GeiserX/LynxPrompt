# Run a command in a pseudo-terminal that reports 0 columns, and fail if it has
# not exited within the time limit (ora used to loop forever there).
# Usage: python3 pty-zero-columns.py <seconds> <command> [args...]
import fcntl, os, pty, select, signal, struct, sys, termios, time

limit = float(sys.argv[1])
pid, fd = pty.fork()
if pid == 0:
    fcntl.ioctl(0, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 0, 0, 0))
    os.execvp(sys.argv[2], sys.argv[2:])

written = 0
end = time.time() + limit
while time.time() < end:
    if select.select([fd], [], [], 0.2)[0]:
        try:
            written += len(os.read(fd, 65536))
        except OSError:
            pass
    done, status = os.waitpid(pid, os.WNOHANG)
    if done:
        print(f"exited with status {os.waitstatus_to_exitcode(status)} after writing {written} bytes")
        sys.exit(0)
os.kill(pid, signal.SIGKILL)
os.waitpid(pid, 0)
print(f"still running after {limit}s, {written} bytes written")
sys.exit(1)
