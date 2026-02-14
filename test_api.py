import requests
import base64
import os
import sys

# CONFIGURATION
API_URL = "https://r1r21nb-tracev2.hf.space/process"
OUTPUT_DIR = "test_results"

def test_image(image_path):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    print(f"Testing {image_path}...")
    
    with open(image_path, "rb") as f:
        files = {"file": f}
        data = {
            "model_type": "anime", 
            "output_format": "svg"
        }
        
        try:
            response = requests.post(API_URL, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Save Raster (WebP)
                if "image" in result:
                    img_data = result["image"].split(",")[1]
                    base_name = os.path.basename(image_path).split(".")[0]
                    with open(f"{OUTPUT_DIR}/{base_name}_result.webp", "wb") as out:
                        out.write(base64.b64decode(img_data))
                    print(f"  [OK] Saved image: {OUTPUT_DIR}/{base_name}_result.webp")
                
                # Save SVG
                if "svg" in result:
                    base_name = os.path.basename(image_path).split(".")[0]
                    with open(f"{OUTPUT_DIR}/{base_name}_result.svg", "w") as out:
                        out.write(result["svg"])
                    print(f"  [OK] Saved SVG: {OUTPUT_DIR}/{base_name}_result.svg")
                    
            else:
                print(f"  [FAIL] Status {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"  [ERROR] {e}")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # Check if user provided arguments
    if len(sys.argv) > 1:
        for img in sys.argv[1:]:
            test_image(img)
    else:
        print("Usage: python test_api.py <path_to_image1> <path_to_image2> ...")
        print("\nNo images provided. Please run with an image path, e.g.:")
        print("python test_api.py my_sketch.jpg")
