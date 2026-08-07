"""NaijaCounts backend package.

FastAPI service for plate-analysis: identifies dishes from a photo with a
vision model, resolves them against the FAO/WAFCT database, and returns a
combined calorie report mirroring the frontend `scannedFoodData` shape.
"""