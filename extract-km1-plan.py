from html import escape
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\km1\LAYOUT PLAN.pdf")
OUT = ROOT / "km1-plan.svg"


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


def display_point(page_h, x, y):
    return x, page_h - y


def styled_stroke(source_color, source_width):
    if source_color == "#000000":
        if source_width >= 0.9:
            return "#e8f8ff", "0.82", 0.88
        return "#b8d9e5", "0.56", 0.7
    if source_color == "#808285":
        return "#9bb5c2", "0.42", 0.8
    if source_color == "#cd2027":
        return "#ff7b8c", "0.96", 1.18
    if source_color == "#93278f":
        return "#c770ff", "0.9", 1.16
    if source_color == "#293189":
        return "#77d8ff", "0.98", 1.08
    return source_color, "0.68", 0.8


def styled_fill(source_color):
    if source_color == "#ffffff":
        return "#ffffff", "0"
    return source_color, "0.08"


def main():
    page = PdfReader(str(SOURCE)).pages[0]
    ops = page.get_contents().operations
    page_w = float(page.mediabox.width)
    page_h = float(page.mediabox.height)

    state = {"ctm": [1, 0, 0, 1, 0, 0], "stroke": (0, 0, 0), "fill": (0, 0, 0), "width": 1}
    stack = []
    path_cmds = []
    elements = []

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
            x, y = display_point(page_h, x, y)
            path_cmds.append(f"M {fmt(x)} {fmt(y)}")
        elif operator == "l":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            x, y = display_point(page_h, x, y)
            path_cmds.append(f"L {fmt(x)} {fmt(y)}")
        elif operator == "re":
            x, y = transform_point(state["ctm"], float(operands[0]), float(operands[1]))
            w = float(operands[2])
            h = float(operands[3])
            x1, y1 = display_point(page_h, x, y)
            x2, y2 = display_point(page_h, x + w, y + h)
            path_cmds.append(f"M {fmt(x1)} {fmt(y1)} L {fmt(x2)} {fmt(y1)} L {fmt(x2)} {fmt(y2)} L {fmt(x1)} {fmt(y2)} Z")
        elif operator == "h":
            path_cmds.append("Z")
        elif operator == "S":
            if path_cmds:
                stroke, opacity, width_scale = styled_stroke(color(state["stroke"]), state["width"])
                elements.append(
                    f'<path d="{escape(" ".join(path_cmds))}" fill="none" '
                    f'stroke="{stroke}" stroke-width="{fmt(max(0.45, state["width"] * width_scale))}" '
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

    joined = "\n    ".join(elements)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(page_w)} {fmt(page_h)}" '
        f'width="{fmt(page_w)}" height="{fmt(page_h)}">\n'
        '  <rect width="100%" height="100%" fill="none"/>\n'
        '  <g id="km1-pdf-vector">\n'
        f'    {joined}\n'
        "  </g>\n"
        "</svg>\n"
    )
    OUT.write_text(svg, encoding="utf-8")
    print(OUT)
    print(f"{len(elements)} elements")
    print(f"{len(svg)} bytes")


if __name__ == "__main__":
    main()
