from html import escape
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\RAMAII\rama2 layout PLAN.pdf")
OUT = ROOT / "rama2-plan.svg"
VIEWBOX_PADDING = 12


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


def fmt(value):
    return f"{value:.2f}".rstrip("0").rstrip(".")


def color(rgb):
    channels = [max(0, min(255, round(float(value) * 255))) for value in rgb]
    return f"#{channels[0]:02x}{channels[1]:02x}{channels[2]:02x}"


def styled_stroke(source_color, source_width):
    if source_color == "#000000":
        if source_width >= 0.9:
            return "#e8f8ff", "0.94", 0.82
        return "#b8d9e5", "0.56", 0.72
    if source_color == "#93278f":
        return "#c76dff", "0.78", 1.08
    if source_color == "#992a2e":
        return "#ff7786", "0.62", 0.92
    return source_color, "0.72", 0.8


def styled_fill(source_color):
    if source_color == "#f8991e":
        return "#f5c778", "0.08"
    return source_color, "0.12"


def main():
    page = PdfReader(str(SOURCE)).pages[0]
    ops = page.get_contents().operations
    page_w = float(page.mediabox.width)
    page_h = float(page.mediabox.height)

    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "fill": (0, 0, 0), "width": 1}
    stack = []
    path_cmds = []
    elements = []
    all_points = []

    for operands, op in ops:
        operator = op.decode() if isinstance(op, bytes) else op
        if operator == "q":
            stack.append((state.copy(), list(path_cmds)))
            path_cmds = []
        elif operator == "Q":
            state, path_cmds = stack.pop()
        elif operator == "cm":
            state["ctm"] = matmul(state["ctm"], [float(value) for value in operands])
        elif operator == "RG":
            state["stroke"] = tuple(float(value) for value in operands)
        elif operator == "rg":
            state["fill"] = tuple(float(value) for value in operands)
        elif operator == "w":
            state["width"] = float(operands[0])
        elif operator == "m":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            all_points.append((x, y))
            path_cmds.append(f"M {fmt(x)} {fmt(y)}")
        elif operator == "l":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            all_points.append((x, y))
            path_cmds.append(f"L {fmt(x)} {fmt(y)}")
        elif operator == "h":
            path_cmds.append("Z")
        elif operator == "S":
            if path_cmds:
                stroke, opacity, width_scale = styled_stroke(color(state["stroke"]), state["width"])
                elements.append(
                    f'<path d="{escape(" ".join(path_cmds))}" fill="none" '
                    f'stroke="{stroke}" stroke-width="{fmt(max(0.44, state["width"] * width_scale))}" '
                    f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"/>'
                )
            path_cmds = []
        elif operator in ("f*", "f"):
            if path_cmds:
                fill, opacity = styled_fill(color(state["fill"]))
                elements.append(
                    f'<path d="{escape(" ".join(path_cmds))}" fill="{fill}" '
                    f'fill-rule="evenodd" opacity="{opacity}"/>'
                )
            path_cmds = []

    min_x = max(0, min(point[0] for point in all_points) - VIEWBOX_PADDING)
    min_y = max(0, min(point[1] for point in all_points) - VIEWBOX_PADDING)
    max_x = min(page_w, max(point[0] for point in all_points) + VIEWBOX_PADDING)
    max_y = min(page_h, max(point[1] for point in all_points) + VIEWBOX_PADDING)
    crop_w = max_x - min_x
    crop_h = max_y - min_y

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(min_x)} {fmt(min_y)} {fmt(crop_w)} {fmt(crop_h)}" '
        f'width="{fmt(crop_w)}" height="{fmt(crop_h)}">\n'
        '  <rect width="100%" height="100%" fill="none"/>\n'
        '  <g id="rama2-pdf-vector">\n'
        f'    {"\n    ".join(elements)}\n'
        "  </g>\n"
        "</svg>\n"
    )
    OUT.write_text(svg, encoding="utf-8")
    print(OUT)
    print(f"{len(elements)} elements")
    print(f"{len(svg)} bytes")


if __name__ == "__main__":
    main()
