set shell := ["bash", "-euo", "pipefail", "-c"]

# ---------------------------------------------------------------------------- #
#                                   COMMANDS                                   #
# ---------------------------------------------------------------------------- #

# Show available commands
default:
    @just --list

# Copy inverse prices (1/price) for a TSV file to the clipboard; pass -v/--verbose to also print
[macos]
[script("bash")]
inverse file *flags="":
    set -euo pipefail
    output=$(awk 'NR>1 && $2 {printf "%.7f\n", 1/$2}' {{ file }})
    printf '%s\n' "$output" | pbcopy
    echo '{{ BOLD + GREEN }}📋 Copied inverse prices to clipboard{{ NORMAL }}'
    if [[ " {{ flags }} " == *" -v "* || " {{ flags }} " == *" --verbose "* ]]; then
        printf '%s\n' "$output"
    fi
alias inv := inverse
