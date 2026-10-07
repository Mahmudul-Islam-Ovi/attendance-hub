import os

sdk_dir = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk\licenses")
os.makedirs(sdk_dir, exist_ok=True)

licenses = {
    "android-sdk-license": [
        "89377762400b6133204e30da37ac3033214acb83",
        "24333f8a63cbd82dd1f0e118edd359614b81f32e",
        "d56f5187479451eabf01fb78af6dfcb131a6481e"
    ],
    "android-sdk-preview-license": [
        "84831b9409646a2b10e283218179e48c44b64497"
    ],
    "android-googletv-license": [
        "601085b94cd77f0b54ff8640695709915000ce0d"
    ],
    "android-sdk-arm-dbt-license": [
        "859f317696f67ef3d7f30a50a5560e7834b43903"
    ],
    "google-gdk-license": [
        "33b6a2b649200299f52d9584cfb8dd3270d01b46"
    ],
    "intel-android-extra-license": [
        "d975f751698a77b662f1254ddbeed3901e976f5a"
    ],
    "mips-android-sysimage-license": [
        "e9acab5b5fbb560a72cfa4f604b90c8441e3d1ec"
    ]
}

for name, hashes in licenses.items():
    file_path = os.path.join(sdk_dir, name)
    existing = set()
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            existing = set(line.strip() for line in f if line.strip())
    existing.update(hashes)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(existing) + "\n")
    print(f"Updated {name}: {len(existing)} hashes")

print("All Android licenses successfully written.")
