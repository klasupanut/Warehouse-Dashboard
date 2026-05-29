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


def collect_segments():
    page = PdfReader(str(SOURCE)).pages[0]
    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "width": 1}
    stack = []
    current = []
    segments = []

    for operands, op in page.get_contents().operations:
        operator = op.decode() if isinstance(op, bytes) else op
        if operator == "q":
            stack.append((state.copy(), list(current)))
            current = []
        elif operator == "Q":
            state, current = stack.pop()
        elif operator == "cm":
            state["ctm"] = matmul(state["ctm"], [float(value) for value in operands])
        elif operator == "RG":
            state["stroke"] = tuple(float(value) for value in operands)
        elif operator == "w":
            state["width"] = float(operands[0])
        elif operator == "m":
            current = [transform_point(state["ctm"], float(operands[0]), float(operands[1]))]
        elif operator == "l":
            point = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            if current:
                previous = current[-1]
                segments.append((color(state["stroke"]), previous[0], previous[1], point[0], point[1]))
            current.append(point)
        elif operator == "re":
            x = float(operands[0])
            y = float(operands[1])
            w = float(operands[2])
            h = float(operands[3])
            points = [
                transform_point(state["ctm"], x, y),
                transform_point(state["ctm"], x + w, y),
                transform_point(state["ctm"], x + w, y + h),
                transform_point(state["ctm"], x, y + h),
                transform_point(state["ctm"], x, y),
            ]
            for first, second in zip(points, points[1:]):
                segments.append((color(state["stroke"]), first[0], first[1], second[0], second[1]))
        elif operator in ("S", "f", "f*"):
            current = []
    return segments


def main():
    segments = collect_segments()
    for stroke in ("#cd2027", "#93278f", "#293189"):
        print(stroke)
        candidates = []
        for color_value, x1, y1, x2, y2 in segments:
            if color_value != stroke:
                continue
            length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
            if length < 8:
                continue
            candidates.append((length, x1, y1, x2, y2))
        for length, x1, y1, x2, y2 in sorted(candidates, reverse=True)[:120]:
            angle = 0
            if length:
                import math
                angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
            print(f"  len={fmt(length)} angle={fmt(angle)} ({fmt(x1)},{fmt(y1)}) -> ({fmt(x2)},{fmt(y2)})")


if __name__ == "__main__":
    main()
