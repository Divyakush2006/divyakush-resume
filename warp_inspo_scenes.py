import cv2
import numpy as np
import os

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def auto_warp(target_path, ui_path, out_path, manual_corners=None):
    if not os.path.exists(target_path) or not os.path.exists(ui_path):
        print(f"Missing: {target_path} or {ui_path}")
        return
        
    target_img = cv2.imread(target_path)
    ui_img = cv2.imread(ui_path)
    
    h_ui, w_ui = ui_img.shape[:2]
    src_pts = np.array([
        [0, 0],
        [w_ui - 1, 0],
        [w_ui - 1, h_ui - 1],
        [0, h_ui - 1]
    ], dtype="float32")
    
    if manual_corners is not None:
        dst_pts = order_points(np.array(manual_corners, dtype="float32"))
    else:
        # Detect screen
        gray = cv2.cvtColor(target_img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        h, w = target_img.shape[:2]
        best_quad = None
        max_area = 0
        
        for th in [40, 60, 90, 120, 150, 180, 210]:
            _, thresh = cv2.threshold(blur, th, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                area = cv2.contourArea(c)
                if area > (w * h * 0.08) and area < (w * h * 0.70):
                    peri = cv2.arcLength(c, True)
                    approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                    if len(approx) == 4 and area > max_area:
                        max_area = area
                        best_quad = approx.reshape(4, 2)
                        
        if best_quad is None:
            print("Failed to auto-detect quad for", target_path)
            return
        dst_pts = order_points(best_quad)
        
    print(f"Warping {os.path.basename(ui_path)} onto {os.path.basename(target_path)}")
    print("Screen corners:", dst_pts.tolist())
    
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped_ui = cv2.warpPerspective(ui_img, M, (target_img.shape[1], target_img.shape[0]))
    
    mask = np.zeros((target_img.shape[0], target_img.shape[1]), dtype="uint8")
    cv2.fillConvexPoly(mask, dst_pts.astype(int), 255)
    
    kernel = np.ones((3, 3), np.uint8)
    mask_eroded = cv2.erode(mask, kernel, iterations=1)
    mask_blur = cv2.GaussianBlur(mask_eroded.astype("float32"), (3, 3), 0) / 255.0
    mask_3d = cv2.merge([mask_blur, mask_blur, mask_blur])
    
    result = (warped_ui * mask_3d + target_img * (1.0 - mask_3d)).astype(np.uint8)
    cv2.imwrite(out_path, result)
    print("Saved successfully:", out_path)

brain = r"C:\Users\DK\.gemini\antigravity-ide\brain\682ad4fb-cc16-43b9-badf-f1f5bbd9a542"
base = r"D:\dk-portfolio\new trial"

tasks = [
    {
        "target": os.path.join(brain, "inspo_dineguru_laptop_1787047772331.png"),
        "ui": os.path.join(base, "dineguru", "Screenshot 2026-08-05 191403.png"),
        "out": os.path.join(base, "dineguru", "final", "inspo_perfect_dineguru_cafe.png")
    },
    {
        "target": os.path.join(brain, "inspo_governai_monitor_1787047788861.png"),
        "ui": os.path.join(base, "GovernAI Studio", "Screenshot 2026-08-16 142637.png"),
        "out": os.path.join(base, "GovernAI Studio", "final", "inspo_perfect_governai_sunlit.png")
    }
]

for t in tasks:
    auto_warp(t["target"], t["ui"], t["out"])
