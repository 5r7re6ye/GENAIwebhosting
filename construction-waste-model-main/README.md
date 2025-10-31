# **construction_waste_classification**

*Construction Waste Image Recognition Module for Smart Matching Platform*

![Python](https://img.shields.io/badge/Python-3.10-blue.svg)
![Framework](https://img.shields.io/badge/Framework-Roboflow-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-Prototype-yellow.svg)

---

## **Project Background**

This module is a component of the **Construction Waste Smart Matching Platform**, designed to automatically **classify uploaded construction waste images** into **recyclable categories**.
It provides **structured data** to support subsequent *semantic matching* and *resource pairing* in the platform.

The classification categories are based on the **Hong Kong Environmental Protection Department (EPD)**’s official recyclable construction waste list.
🔗 [Official EPD Reference](https://www.epd.gov.hk/epd/misc/cdm/b5_products1.htm)

---

## **Recyclable Construction Waste Categories**

| **Chinese Category** | **English Label (for Model)** |
| :----------: | :--------------------: |
|      玻璃      |         `glass`        |
| 公眾填料（瓦礫及混凝土） |      `public_fill`     |
|      金屬      |         `metal`        |
|      瀝青      |        `asphalt`       |
|      煤灰      |  `pulverized_fue_ash`  |
|     泡沫塑膠     | `expanded_polystyrene` |
|      塑膠      |        `plastic`       |
|     碎石骨料     |       `aggregate`      |
|      挖掘料     |  `excavated_materials` |
|      橡膠      |        `rubber`        |


Each category includes **~50 crawled images**, which were uploaded to **Roboflow** for preprocessing, augmentation, and model training.
The result is a **lightweight image classification model** optimized for integration into real-time waste matching systems.

---

## **Model Training Workflow (via Roboflow)**

1. **Register & log in** to [Roboflow](https://roboflow.com)
2. **Upload images** — one folder per waste category
3. **Create a dataset version** (optional: enable augmentation)
4. Click **Train Model** to begin training
5. **Retrieve model ID** (e.g., `your_model_id/1`) for inference use

> *Note:* Roboflow automatically filters some images upon upload.
> The final dataset (`classification_dataset`) can be downloaded as a ZIP file from the project page (**Download → Download zip to computer**).

---

## **Running the Classifier**

Set up the environment (recommended: **Python 3.10**):

```bash
conda create -n waste_classification python=3.10
conda activate waste_classification
pip install git+https://github.com/roboflow/inference.git
```

Then run the classifier script:

```bash
python classification.py --image your_image.jpg --model your_model_id/1
```

---

## **Model Highlights**

* **Lightweight architecture** suitable for edge or web deployment
* **Multi-class classification** covering 10 recyclable waste types
* **Fast inference** with Roboflow Inference SDK
* **Integrable** with the smart matching API for resource exchange
* **Supports sustainability goals** aligned with HK EPD guidelines

---

## **Future Work**

* Expand dataset with higher-resolution waste samples
* Integrate semantic search with vector embeddings
* Enhance model robustness with *hard negative samples*

---

## **License**

This project is released under the **MIT License**.
Feel free to use, modify, and distribute with proper attribution.
