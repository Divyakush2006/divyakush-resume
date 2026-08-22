import re

path = r"C:\Users\DK\.gemini\antigravity-ide\brain\5370bedf-b796-46df-aecb-58cf253dd7b2\.system_generated\steps\369\content.md"

with open(path, "r", encoding="utf-8") as f:
    css = f.read()

# Let's search for hex codes
hex_codes = re.findall(r"#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}", css)
print("--- Hex Codes found in CSS ---")
for hex_code in set(hex_codes):
    print(hex_code)

# Let's search specifically for the background-color or color of .hero-heading or body
body_styles = re.findall(r"body\{[^}]+\}", css)
print("\n--- body Styles ---")
for style in body_styles:
    print(style)
