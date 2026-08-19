#!/usr/bin/env python3
"""Run the Omni Terrain Keystone Wave-1 pipeline safely end-to-end.

Designed for /home/ubuntu/keystone on the Lightsail host. The script creates a dated
backup of current generated outputs, runs regression tests, rebuilds the 97k master
catalogue and Wave 1, seeds original factual copy into a separate approval file, runs
commerce gates, audits launch readiness, and builds a noindex staging storefront.

It never promotes staging to the live website and never auto-approves sale/ads gates.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/home/ubuntu/keystone")
FEED = ROOT / "feed"
STAGING = ROOT / "staging" / "wave1-site"
BACKUP_NAMES = [
    "master_catalog.csv", "marketing_candidates.csv", "storefront_candidates.csv",
    "expansion_candidates.csv", "hero_core_market_research.csv", "launch_wave1.csv",
    "commerce_approvals.csv", "commerce_approvals_seeded.csv", "catalogue_visible.csv",
    "checkout_ready.csv", "google_search_ads_ready.csv", "google_merchant_ready.csv",
    "google_merchant_feed.tsv", "commerce_gate_report.csv", "launch_readiness.json",
]
SCRIPT_NAMES = [
    "keystone-master-catalogue.py", "keystone-storefront-focus.py", "keystone-wave1-audit.py",
    "keystone-commerce-gate.py", "keystone-launch-readiness.py", "keystone-build-storefront.py",
    "keystone-seed-factual-content.py",
]


def locate_script(name):
    here = Path(__file__).resolve().parent
    candidates = [here / name, ROOT / name, ROOT / "scripts" / name]
    for path in candidates:
        if path.exists():
            return path
    raise SystemExit(f"Missing required script: {name}. Checked: " + ", ".join(str(p) for p in candidates))


def run(label, *args):
    command = [str(arg) for arg in args]
    print(f"\n=== {label} ===", flush=True)
    print("$", " ".join(command), flush=True)
    subprocess.run(command, check=True)


def backup_outputs():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = FEED / "backups" / stamp
    copied = 0
    for name in BACKUP_NAMES:
        source = FEED / name
        if source.exists():
            destination.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination / name)
            copied += 1
    if STAGING.exists():
        destination.mkdir(parents=True, exist_ok=True)
        shutil.make_archive(str(destination / "wave1-site"), "gztar", root_dir=STAGING)
        copied += 1
    print(f"BACKUP ITEMS = {copied}")
    print(f"BACKUP DIR = {destination if copied else 'none required'}")
    return destination if copied else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-master", action="store_true", help="reuse existing master_catalog.csv after self-tests")
    parser.add_argument("--skip-backup", action="store_true")
    args = parser.parse_args()

    if not FEED.exists():
        raise SystemExit(f"Feed directory missing: {FEED}")
    inventory = FEED / "Inventory.csv"
    if not args.skip_master and not inventory.exists():
        raise SystemExit(f"Keystone Inventory.csv missing: {inventory}")

    scripts = {name: locate_script(name) for name in SCRIPT_NAMES}
    python = sys.executable

    print("=== OMNI TERRAIN WAVE-1 SAFE STAGING RUN ===")
    print("ROOT =", ROOT)
    print("FEED =", FEED)
    print("STAGING =", STAGING)
    if not args.skip_backup:
        backup_outputs()

    for name in (
        "keystone-master-catalogue.py", "keystone-storefront-focus.py",
        "keystone-commerce-gate.py", "keystone-launch-readiness.py",
        "keystone-build-storefront.py", "keystone-seed-factual-content.py",
    ):
        run(f"SELF TEST {name}", python, scripts[name], "--self-test")

    master = FEED / "master_catalog.csv"
    if args.skip_master:
        if not master.exists():
            raise SystemExit(f"--skip-master requested but {master} does not exist")
        print("\nMASTER REBUILD = SKIPPED BY REQUEST")
    else:
        run("REBUILD 97K MASTER CATALOGUE", python, scripts["keystone-master-catalogue.py"])

    run("REBUILD WAVE-1 SELECTION", python, scripts["keystone-storefront-focus.py"])
    run("AUDIT WAVE-1", python, scripts["keystone-wave1-audit.py"])
    run("INITIALIZE / MERGE APPROVAL LEDGER", python, scripts["keystone-commerce-gate.py"], "--init-approvals")
    run("SEED ORIGINAL FACTUAL CATALOGUE COPY", python, scripts["keystone-seed-factual-content.py"])
    run(
        "RUN COMMERCE GATES ON SEEDED COPY",
        python, scripts["keystone-commerce-gate.py"],
        "--approvals", FEED / "commerce_approvals_seeded.csv",
    )
    run("AUDIT LAUNCH READINESS", python, scripts["keystone-launch-readiness.py"])
    run("BUILD NOINDEX STAGING STOREFRONT", python, scripts["keystone-build-storefront.py"])

    print("\n=== STAGING PIPELINE COMPLETE ===")
    print("STAGING =", STAGING)
    print("MANIFEST =", STAGING / "storefront-manifest.json")
    print("READINESS =", FEED / "launch_readiness.json")
    print("APPROVAL WORKFILE =", FEED / "commerce_approvals_seeded.csv")
    print("LIVE WEBSITE WAS NOT MODIFIED.")


if __name__ == "__main__":
    main()
