#!/usr/bin/env python3
import subprocess
import sys

# Run migrations
result = subprocess.run(
    [
        "docker",
        "compose",
        "exec",
        "-T",
        "backend",
        "sh",
        "-c",
        "cd /app && alembic upgrade head",
    ],
    cwd="/Users/mullsy/workspace/buffetiser-2-0",
    capture_output=True,
    text=True,
    timeout=30,
)

print("Migration stdout:", result.stdout)
print("Migration stderr:", result.stderr)
print("Migration return code:", result.returncode)

# Check tables
result2 = subprocess.run(
    [
        "docker",
        "compose",
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "buffetiser",
        "-d",
        "BUFFETISER_DB",
        "-c",
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    ],
    cwd="/Users/mullsy/workspace/buffetiser-2-0",
    capture_output=True,
    text=True,
    timeout=30,
)

print("\nTables query stdout:")
print(result2.stdout)
print("Tables query stderr:", result2.stderr)
