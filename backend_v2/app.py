import os
import io
import cv2
import base64
import numpy as np
import torch
import tempfile
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from controlnet_aux import LineartDetector
import vtracer

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Vision Engine Loaded on: {device}")

# Initialize AI Model
lineart_model = LineartDetector.from_pretrained("lllyasviel/Annotators")
lineart_model.to(device)


# ==========================================
# 2. IMAGE PROCESSING PIPELINE
# ==========================================

def post_process_lines(pil_image):
    """
    Cleans, smooths, and thickens lines.
    Returns: Black Lines on White Background (RGB).
    """
    img_array = np.array(pil_image)
    
    # Ensure Grayscale
    if len(img_array.shape) == 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # 1. Threshold (Get White Lines on Black BG)
    # ControlNet usually outputs White Lines. Ensure we have strong signals.
    _, binary = cv2.threshold(img_array, 200, 255, cv2.THRESH_BINARY)
    
    # 2. Speckle Removal (on White Lines)
    # Remove tiny white dots (noise)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
    
    min_area = 20  # Remove small loose pixels
    clean_lines = np.zeros_like(binary)
    
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area >= min_area:
            clean_lines[labels == i] = 255
            
    # 3. Smooth & Thicken (Morphological Dilation)
    # A small dilation connects broken lines and makes them "cuttable"
    kernel = np.ones((2,2), np.uint8)
    thickened = cv2.dilate(clean_lines, kernel, iterations=1)
    
    # 4. Invert to Standard Line Art (Black Lines on White BG)
    final_image = cv2.bitwise_not(thickened)
    
    return Image.fromarray(final_image).convert("RGB") # Return RGB for consistency

@app.get("/")
def home():
    return {"status": "TraceMaster Precision Vision Online", "device": device}

@app.post("/process")
async def process_image(
    file: UploadFile = File(...), 
    model_type: str = Form("anime"),
    output_format: str = Form("webp")
):
    # Read Input
    contents = await file.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # STEP 1: AI Line Extraction
    extracted_lines = lineart_model(pil_image, coarse=(model_type == "anime"))
    
    # STEP 2: Post-Processing (Clean + Invert)
    final_raster = post_process_lines(extracted_lines)
    
    result_data = {}
    
    # STEP 3: Vectorization (Optimized for Smoothness)
    if output_format == "svg":
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            final_raster.save(tmp_png.name)
            tmp_svg_path = tmp_png.name + ".svg"
            
            try:
                vtracer.convert_image_to_svg_py(
                    tmp_png.name,
                    tmp_svg_path,
                    colormode="binary",      
                    hierarchical="cut",      
                    mode="spline",           
                    filter_speckle=20,       # Cleanup remaining noise
                    color_precision=6,       
                    layer_difference=16,     
                    corner_threshold=60,     # Higher = Smoother corners (less sharp)
                    length_threshold=5.0,    # Ignore tiny segments < 5px
                    max_iterations=10,       
                    splice_threshold=45,     
                    path_precision=3         
                )
                
                if os.path.exists(tmp_svg_path):
                    with open(tmp_svg_path, "r", encoding="utf-8") as f:
                        result_data["svg"] = f.read()
            except Exception as e:
                print(f"Vectorization Failed: {e}")
            finally:
                if os.path.exists(tmp_png.name): os.unlink(tmp_png.name)
                if os.path.exists(tmp_svg_path): os.unlink(tmp_svg_path)

    # Return Raster
    buffered = io.BytesIO()
    final_raster.save(buffered, format="WEBP", quality=95)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    result_data["image"] = f"data:image/webp;base64,{img_str}"

    return JSONResponse(content=result_data)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)