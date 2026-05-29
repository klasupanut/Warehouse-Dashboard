from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\km1\LAYOUT PLAN.pdf")
OUT_DIR = ROOT / ".sheet-build" / "km1-preview"


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


def collect_paths():
    page = PdfReader(str(SOURCE)).pages[0]
    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "width": 1}
    stack = []
    paths = []
    current = []
    all_points = []

    for operands, op in page.get_contents().operations:
        operator = op.decode() if isinstance(op, bytes) else op
        if operator == "q":
            stack.append((state.copy(), [list(part) for part in current]))
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
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            current.append([(x, y)])
            all_points.append((x, y))
        elif operator == "l":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            if not current:
                current.append([])
            current[-1].append((x, y))
            all_points.append((x, y))
        elif operator == "re":
            x1, y1 = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            x2, y2 = transform_point(state["ctm"], float(operands[0]) + float(operands[2]), float(operands[1]) + float(operands[3]))
            current.append([(x1, y1), (x2, y1), (x2, y2), (x1, y2), (x1, y1)])
            all_points.extend([(x1, y1), (x2, y2)])
        elif operator == "h":
            if current and current[-1]:
                current[-1].append(current[-1][0])
        elif operator == "S":
            stroke = color(state["stroke"])
            for part in current:
                if len(part) > 1:
                    paths.append({"stroke": stroke, "width": state["width"], "points": part})
            current = []
        elif operator in ("f", "f*"):
            current = []

    return paths, all_points


def render(paths, all_points, filename, selected_colors=None, crop=None, scale=3):
    if crop:
      min_x, min_y, max_x, max_y = crop
    else:
      min_x = min(point[0] for point in all_points) - 16
      min_y = min(point[1] for point in all_points) - 16
      max_x = max(point[0] for point in all_points) + 16
      max_y = max(point[1] for point in all_points) + 16

    width = int((max_x - min_x) * scale)
    height = int((max_y - min_y) * scale)
    image = Image.new("RGB", (width, height), "#071016")
    draw = ImageDraw.Draw(image)

    palette = {
        "#cd2027": "#ff7786",
        "#93278f": "#c76dff",
        "#293189": "#7dd3ff",
        "#000000": "#d7eef7",
        "#a6a6a6": "#7e9aa5",
    }
    for path in paths:
        if selected_colors and path["stroke"] not in selected_colors:
            continue
        points = [
            ((x - min_x) * scale, (max_y - y) * scale)
            for x, y in path["points"]
            if min_x - 5 <= x <= max_x + 5 and min_y - 5 <= y <= max_y + 5
        ]
        if len(points) > 1:
            draw.line(points, fill=palette.get(path["stroke"], path["stroke"]), width=max(1, int(path["width"] * scale)))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / filename
    image.save(output)
    print(output)


def main():
    paths, all_points = collect_paths()
    render(paths, all_points, "km1-plan-preview.png", selected_colors={"#cd2027", "#93278f", "#293189", "#000000"}, scale=3)
    render(paths, all_points, "km1-blue-labels.png", selected_colors={"#293189"}, crop=(330, 80, 545, 1060), scale=7)
    render(paths, all_points, "km1-red-purple.png", selected_colors={"#cd2027", "#93278f"}, crop=(295, 70, 555, 1110), scale=5)


if __name__ == "__main__":
    main()
