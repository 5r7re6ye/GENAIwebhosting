from inference_sdk import InferenceHTTPClient
from PIL import Image
import base64

# Initialize Roboflow client
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="NospYypRZBtI13sAxp9E"
)

# Predefined category list (10 classes you trained)
known_categories = [
    "aggregate", "asphalt", "excavated_materials", "expanded_polystyrene", "glass",
    "metal", "plastic", "public_fill", "pulverized_fue_ash", "rubber"
]

# Image path for inference
image_path = "D://000057.jpg"

# Call Roboflow model for inference
result = CLIENT.infer(image_path, model_id="construction_waste_classification-2v2ay/1")

# Extract predictions
predictions = result.get("predictions", [])


if predictions:
    top_class = predictions[0]["class"]
    confidence = predictions[0]["confidence"]

    print(f"Roboflow result: {top_class} (Confidence: {confidence})")

    if confidence < 0.6 or top_class not in known_categories:
        print("Unrecognized")
else:
    print("No category recognized")
