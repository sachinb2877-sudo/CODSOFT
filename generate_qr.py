#!/usr/bin/env python3
"""
Certificate QR Code Generator
=============================
Generates a high-resolution, print-ready QR code for the certificate website once
the public GitHub Pages or Vercel URL is known.

Usage:
    python generate_qr.py "https://<your-username>.github.io/<repo-name>/"
    python generate_qr.py "https://mansi-certificate.vercel.app"

Or simply run without arguments to enter the URL interactively:
    python generate_qr.py
"""

import sys
import os

def generate_qr(target_url, output_filename="certificate_qr.png"):
    if not target_url or not target_url.strip():
        print("[ERROR] Target URL cannot be empty.")
        return False

    target_url = target_url.strip()

    # Warn if localhost or 127.0.0.1
    if "localhost" in target_url.lower() or "127.0.0.1" in target_url:
        print("\n[WARNING] You provided a localhost URL ('" + target_url + "').")
        print("          Smartphones scanning this QR code cannot access localhost!")
        print("          Please deploy the site to GitHub Pages or Vercel and use the public HTTPS URL.")
        confirm = input("Do you still want to continue? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Aborted. Re-run with your public HTTPS URL.")
            return False

    try:
        import qrcode
        from qrcode.constants import ERROR_CORRECT_H
    except ImportError:
        print("[INFO] Installing required 'qrcode[pil]' package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]"])
        import qrcode
        from qrcode.constants import ERROR_CORRECT_H

    print(f"\n[+] Generating high-resolution QR code for:")
    print(f"    --> {target_url}")

    qr = qrcode.QRCode(
        version=None, # Automatically determine best version
        error_correction=ERROR_CORRECT_H, # 30% error correction (great for printed certificates)
        box_size=20, # High DPI for crisp printing
        border=3, # Clean quiet zone
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    # Use Navy-blue fill color matching the website's theme (#0a2540) on pure white background
    img = qr.make_image(fill_color="#0a2540", back_color="#ffffff")
    
    # Save PNG
    output_path = os.path.abspath(output_filename)
    img.save(output_path)

    # Also save standard black & white version for versatile printing
    bw_output_path = os.path.abspath("certificate_qr_black.png")
    qr_bw = qr.make_image(fill_color="#000000", back_color="#ffffff")
    qr_bw.save(bw_output_path)

    print(f"\n[SUCCESS] QR Codes successfully generated:")
    print(f"  1. Navy Blue (Website Theme) : {output_path}")
    print(f"  2. Classic Pure Black        : {bw_output_path}")
    print("\n[NEXT STEPS]")
    print("  1. Test scan with your smartphone camera right off the screen.")
    print("  2. Place either image onto your certificate template before printing/exporting to PDF.")
    print(f"  3. Scanning will directly open: {target_url}\n")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        print("=====================================================")
        print("     CERTIFICATE QR CODE GENERATOR (PRINT READY)     ")
        print("=====================================================")
        print("Enter the final deployed URL of your certificate website.")
        print("Example: https://yourusername.github.io/certificate-verification/")
        print("         https://mansi-certificate.vercel.app")
        print("-----------------------------------------------------")
        try:
            url = input("Public URL: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            sys.exit(0)

    generate_qr(url)
