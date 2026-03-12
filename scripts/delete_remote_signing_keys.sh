#!/bin/bash

set -euo pipefail

SCRIPT_NAME=$(basename "$0")
FORCE_DELETE=false

print_help() {
    cat <<EOF
Usage: $SCRIPT_NAME [--yes|--force] [--help]

Delete all remote SSH signing keys for the currently authenticated GitHub account.

Options:
  --yes, --force   Skip confirmation prompt. Required in non-interactive mode.
  --help, -h       Show this help text.

Safety behavior:
  - Interactive mode prompts for explicit confirmation unless --yes/--force is provided.
  - Non-interactive mode requires --yes/--force.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --yes|--force)
            FORCE_DELETE=true
            shift
            ;;
        --help|-h)
            print_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option '$1'." >&2
            echo "Run '$SCRIPT_NAME --help' for usage information." >&2
            exit 1
            ;;
    esac
done

if ! command -v gh >/dev/null 2>&1; then
    echo "Error: 'gh' CLI is required but not found in PATH." >&2
    exit 1
fi

IS_INTERACTIVE=true
if [[ ! -t 0 || ! -t 1 ]]; then
    IS_INTERACTIVE=false
fi

if [[ "$FORCE_DELETE" != "true" ]]; then
    if [[ "$IS_INTERACTIVE" != "true" ]]; then
        echo "Error: Non-interactive mode requires --yes or --force." >&2
        exit 2
    fi

    echo "WARNING: This will permanently delete ALL remote SSH signing keys for your authenticated GitHub account." >&2
    read -r -p "Type 'yes' to continue: " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        echo "Aborted. No keys were deleted."
        exit 0
    fi
fi

gh_no_token() {
    env -u GITHUB_TOKEN -u GH_TOKEN gh "$@"
}

key_ids=()
found_count=0
deleted_count=0
failed_count=0

if ids_output=$(gh_no_token api /user/ssh_signing_keys --paginate --jq '.[].id'); then
    if [[ -n "${ids_output//$'\n'/}" ]]; then
        while IFS= read -r key_id; do
            if [[ -n "$key_id" ]]; then
                key_ids+=("$key_id")
            fi
        done <<< "$ids_output"
    fi
    found_count=${#key_ids[@]}
else
    failed_count=$((failed_count + 1))
    echo "Failed to list signing keys." >&2
fi

for key_id in "${key_ids[@]}"; do
    if gh_no_token api --method DELETE "/user/ssh_signing_keys/$key_id" >/dev/null 2>&1; then
        deleted_count=$((deleted_count + 1))
        echo "Deleted signing key ID: $key_id"
    else
        failed_count=$((failed_count + 1))
        echo "Failed to delete signing key ID: $key_id" >&2
    fi
done

echo "Summary: found=$found_count deleted=$deleted_count failed=$failed_count"

if [[ $failed_count -gt 0 ]]; then
    exit 1
fi

exit 0