from collections import Counter, defaultdict
from pathlib import Path

from pypdf import PdfReader


SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\chaengwattana\layout plan.pdf")


def matmul(m1, m2):
    a, b, c, d, e, f = m1
    g, h, i, j, k, l = m2
    return [
        a * g + c * h,
        b * g + d * h,
        a * i + c * j,
        b * i + d * j,
        a * k + c * l + e,
        b * k + d * l + f,
    ]


def transform_point(matrix, x, y):
    a, b, c, d, e, f = matrix
    return a * x + c * y + e, b * x + d * y + f


def color(rgb):
    channels = [max(0, min(255, round(float(value) * 255))) for value in rgb]
    return f"#{channels[0]:02x}{channels[1]:02x}{channels[2]:02x}"


def display_point(page_h, x, y):
    return x, page_h - y


def main():
    page = PdfReader(str(SOURCE)).pages[0]
    ops = page.get_contents().operations
    page_h = float(page.mediabox.height)
    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "fill": (0, 0, 0), "width": 1}
    stack = []
    points = []
    paths = []

    for operands, op in ops:
        operator = op.decode() if isinstance(op, bytes) else op
        if operator == "q":
            stack.append((state.copy(), list(points)))
            points = []
        elif operator == "Q":
            state, points = stack.pop()
        elif operator == "cm":
            state["ctm"] = matmul(state["ctm"], [float(value) for value in operands])
        elif operator == "RG":
            state["stroke"] = tuple(float(value) for value in operands)
        elif operator == "rg":
            state["fill"] = tuple(float(value) for value in operands)
        elif operator == "w":
            state["width"] = float(operands[0])
        elif operator in ("m", "l"):
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            points.append(display_point(page_h, x, y))
        elif operator == "re":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            w = float(operands[2])
            h = float(operands[3])
            pts = [
                display_point(page_h, x, y),
                display_point(page_h, x + w, y),
                display_point(page_h, x + w, y + h),
                display_point(page_h, x, y + h),
            ]
            points.extend(pts)
        elif operator in ("S", "f", "f*"):
            if points:
                xs = [p[0] for p in points]
                ys = [p[1] for p in points]
                paths.append(
                    {
                        "op": operator,
                        "stroke": color(state["stroke"]),
                        "fill": color(state["fill"]),
                        "width": round(float(state["width"]), 3),
                        "bbox": (round(min(xs), 2), round(min(ys), 2), round(max(xs), 2), round(max(ys), 2)),
                        "points": len(points),
                    }
                )
            points = []

    print("colors")
    for key, count in Counter((p["op"], p["stroke"], p["fill"], p["width"]) for p in paths).most_common(40):
        print(count, key)

    print("\ninteresting boxes")
    for path in paths:
        x1, y1, x2, y2 = path["bbox"]
        w = x2 - x1
        h = y2 - y1
        if path["stroke"] not in ("#000000", "#ffffff") and 4 <= w <= 220 and 4 <= h <= 220:
            print(path)


if __name__ == "__main__":
    main()
