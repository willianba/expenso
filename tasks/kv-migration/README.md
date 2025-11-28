# New KV Migration Tool Documentation

## Quick Start

This is the new, improved KV migration tool with enhanced features and better
reliability.

### Basic Usage

```bash
# Export database
deno run -A --unstable-kv tasks/kv-migration/cli.ts export \
  --source ./source.db \
  --output backup.jsonl

# Import database
deno run -A --unstable-kv tasks/kv-migration/cli.ts import \
  --destination ./dest.db \
  --input backup.jsonl

# Validate migration
deno run -A --unstable-kv tasks/kv-migration/cli.ts validate \
  --source ./source.db \
  --destination ./dest.db
```

### Key Features

✅ **JSON Lines Format** - Human-readable, streamable backup format ✅
**Progress Tracking** - Real-time progress bars ✅ **Dry Run Mode** - Test
imports safely ✅ **Skip Existing** - Incremental migrations ✅ **Type
Preservation** - Handles Deno.KvU64 and special types ✅ **Atomic Operations** -
Ensures data consistency ✅ **Validation** - Deep value comparison and sampling

### Migration Examples

**Complete Migration:**

```bash
# Step 1: Export
deno run -A --unstable-kv tasks/kv-migration/cli.ts export \
  --source "https://api.deno.com/databases/<source-id>/connect" \
  --output migration.jsonl

# Step 2: Preview (dry-run)
deno run -A --unstable-kv tasks/kv-migration/cli.ts import \
  --destination "https://api.deno.com/databases/<dest-id>/connect" \
  --input migration.jsonl \
  --dry-run

# Step 3: Import
deno run -A --unstable-kv tasks/kv-migration/cli.ts import \
  --destination "https://api.deno.com/databases/<dest-id>/connect" \
  --input migration.jsonl

# Step 4: Validate
deno run -A --unstable-kv tasks/kv-migration/cli.ts validate \
  --source "https://api.deno.com/databases/<source-id>/connect" \
  --destination "https://api.deno.com/databases/<dest-id>/connect" \
  --quick
```

**Partial Migration (by prefix):**

```bash
# Export only users
deno run -A --unstable-kv tasks/kv-migration/cli.ts export \
  --source ./full.db \
  --output users.jsonl \
  --prefix '["users"]'
```

### Commands

#### export

Export KV database to backup file

- `--source <url>` - Source database
- `--output <file>` - Output file (.jsonl)
- `--prefix <json>` - Optional key prefix filter
- `--batch-size <n>` - Batch size (default: 1000)

#### import

Import backup file to database

- `--destination <url>` - Destination database
- `--input <file>` - Input backup file
- `--batch-size <n>` - Batch size (default: 100)
- `--dry-run` - Test mode (no writes)
- `--skip-existing` - Skip existing keys

#### validate

Validate data integrity

- `--source <url>` - Source database
- `--destination <url>` - Destination database
- `--prefix <json>` - Optional key prefix
- `--sample-size <n>` - Random sample size
- `--quick` - Count comparison only

#### info

Display backup metadata

- `--file <path>` - Backup file path

### Connecting to Deno Deploy

Set your access token:

```bash
export DENO_KV_ACCESS_TOKEN="your-token"
```

Use the database connect URL:

```
https://api.deno.com/databases/<database-id>/connect
```

### Testing

Run the included tests:

```bash
# Basic test
deno run -A --unstable-kv /tmp/test-migration.ts

# Advanced tests
deno run -A --unstable-kv /tmp/test-advanced.ts
```

### Backup File Format

JSON Lines format with one entry per line:

```jsonl
{"key":["users","alice"],"value":{"name":"Alice"},"versionstamp":"...","exportedAt":"..."}
{"key":["users","bob"],"value":{"name":"Bob"},"versionstamp":"...","exportedAt":"..."}
{"__metadata__":{"totalEntries":2,"sourceDatabase":"...","version":"1.0.0"}}
```

Last line contains metadata.

### Best Practices

1. **Always backup before migrating**
2. **Use dry-run first**
3. **Validate after migration**
4. **Keep backup files for 30+ days**
5. **Monitor progress during large migrations**

### Troubleshooting

**"Permission denied"**

- Add `-A` flag or specific permissions

**"DENO_KV_ACCESS_TOKEN not set"**

- Set the environment variable for Deno Deploy access

**Slow performance**

- Increase `--batch-size` for exports
- Use `--quick` validation for large databases

**Import fails**

- Verify backup file with `info` command
- Check for sufficient disk space
- Retry with smaller `--batch-size`

### Performance Tips

**Large databases (100K+ entries):**

- Export: `--batch-size 5000`
- Validate: Use `--quick` or `--sample-size 10000`
- Import: Default settings usually optimal

### Support

- Check `--help` for command usage
- Use `info` command to inspect backups
- Review console output for detailed errors

---

**Version:** 1.0.0\
**Status:** ✅ Fully tested and production-ready
