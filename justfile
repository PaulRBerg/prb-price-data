set shell := ["bash", "-euo", "pipefail", "-c"]

# ---------------------------------------------------------------------------- #
#                                 DEPENDENCIES                                 #
# ---------------------------------------------------------------------------- #

# awk: POSIX text processing
awk := require("awk")

# ---------------------------------------------------------------------------- #
#                                   COMMANDS                                   #
# ---------------------------------------------------------------------------- #

# Show available commands
default:
    @just --list

# Print inverse prices (1/price) for a TSV file, one value per line
inverse file:
    @awk 'NR>1 && $2 {printf "%.7f\n", 1/$2}' {{ file }}
alias inv := inverse
