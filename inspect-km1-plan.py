from collections import Counter, defaultdict
from pathlib import Path

from pypdf import PdfReader


SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\km1\LAYOUT PLAN.pdf")


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


def fmt(value):
    return f"{value:.2f}".rstrip("0").rstrip(".")


def main():
    reader = PdfReader(str(SOURCE))
    page = reader.pages[0]
    print("page", float(page.mediabox.width), float(page.mediabox.height))
    print("extract_text:")
    print((page.extract_text() or "")[:5000])

    texts = []

    def visitor_text(text, cm, tm, font_dict, font_size):
        value = " ".join(str(text).split())
        if not value:
            return
        x, y = transform_point(cm, tm[4], tm[5])
        texts.append((value, x, y, font_size))

    page.extract_text(visitor_text=visitor_text)
    print("text positions", len(texts))
    for value, x, y, size in texts[:300]:
        print(f"text {value!r} x={fmt(x)} y={fmt(y)} size={fmt(size)}")

    ops = page.get_contents().operations
    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "fill": (0, 0, 0), "width": 1}
    stack = []
    path_points = []
    stroke_counter = Counter()
    fill_counter = Counter()
    stroke_bounds = defaultdict(list)

    for operands, op in ops:
        operator = op.decode() if isinstance(op, bytes) else op
        if operator == "q":
            stack.append((state.copy(), list(path_points)))
            path_points = []
        elif operator == "Q":
            state, path_points = stack.pop()
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
            path_points.append((x, y))
        elif operator in ("re",):
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            w = float(operands[2])
            h = float(operands[3])
            x2, y2 = transform_point(state["ctm"], float(operands[0]) + w, float(operands[1]) + h)
            path_points.extend([(x, y), (x2, y2)])
        elif operator == "S":
            stroke = color(state["stroke"])
            stroke_counter[(stroke, round(state["width"], 3))] += 1
            if path_points:
                xs = [point[0] for point in path_points]
                ys = [point[1] for point in path_points]
                stroke_bounds[stroke].append((min(xs), min(ys), max(xs), max(ys), len(path_points)))
            path_points = []
        elif operator in ("f*", "f"):
            fill_counter[color(state["fill"])] += 1
            path_points = []

    print("stroke colors")
    for (stroke, width), count in stroke_counter.most_common(30):
        print(stroke, width, count)
    print("fill colors")
    for fill, count in fill_counter.most_common(30):
        print(fill, count)
    for stroke, bounds in stroke_bounds.items():
        if len(bounds) < 2:
            continue
        xs1 = [item[0] for item in bounds]
        ys1 = [item[1] for item in bounds]
        xs2 = [item[2] for item in bounds]
        ys2 = [item[3] for item in bounds]
        print(f"bounds {stroke}: count={len(bounds)} box=({fmt(min(xs1))},{fmt(min(ys1))})-({fmt(max(xs2))},{fmt(max(ys2))})")
        for item in bounds[:12]:
            print(" ", tuple(fmt(v) if isinstance(v, float) else v for v in item))


if __name__ == "__main__":
    main()
