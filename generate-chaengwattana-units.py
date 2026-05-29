from collections import Counter
from pathlib import Path
import math
import re

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\chaengwattana\layout plan.pdf")
OUT = ROOT / "chaengwattana-units.js"
OUTLINE_UNIT_GAP = 0.18
FALLBACK_UNIT_GAP = 0.18


SIZE_BY_BLOCK = {
    "A": (30, 18),
    "B": (20, 14),
    "C": (20, 14),
    "D": (20, 14),
    "E": (20, 14),
    "H": (20, 14),
    "K": (20, 14),
}


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
    a, b, c, d, e, f = [float(value) for value in matrix]
    return a * x + c * y + e, b * x + d * y + f


def color(rgb):
    channels = [max(0, min(255, round(float(value) * 255))) for value in rgb]
    return f"#{channels[0]:02x}{channels[1]:02x}{channels[2]:02x}"


def display_point(page_h, x, y):
    return x, page_h - y


def collect_outline_paths():
    page = PdfReader(str(SOURCE)).pages[0]
    page_h = float(page.mediabox.height)
    ops = page.get_contents().operations
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
            points.extend([
                display_point(page_h, x, y),
                display_point(page_h, x + w, y),
                display_point(page_h, x + w, y + h),
                display_point(page_h, x, y + h),
            ])
        elif operator == "S":
            stroke = color(state["stroke"])
            if stroke in ("#ed1f24", "#cd2027", "#93278f") and len(points) >= 4:
                xs = [point[0] for point in points]
                ys = [point[1] for point in points]
                width = max(xs) - min(xs)
                height = max(ys) - min(ys)
                if width >= 12 and height >= 4:
                    paths.append(
                        {
                            "id": len(paths),
                            "stroke": stroke,
                            "points": list(points),
                            "bbox": (min(xs), min(ys), max(xs), max(ys)),
                            "area": max(width * height, 1),
                            "angle": path_angle(points),
                        }
                    )
            points = []
        elif operator in ("f", "f*"):
            points = []

    return paths


def path_angle(points):
    segments = []
    for first, second in zip(points, points[1:]):
        dx = second[0] - first[0]
        dy = second[1] - first[1]
        length = math.hypot(dx, dy)
        if length < 4:
            continue
        angle = math.degrees(math.atan2(dy, dx))
        while angle <= -90:
            angle += 180
        while angle > 90:
            angle -= 180
        segments.append((length, angle))
    if not segments:
        return 0
    return max(segments, key=lambda item: item[0])[1]


def infer_angle(label, outline_paths):
    x = label["x"]
    y = label["y"]
    candidates = []
    for path in outline_paths:
        min_x, min_y, max_x, max_y = path["bbox"]
        margin = 18
        if min_x - margin <= x <= max_x + margin and min_y - margin <= y <= max_y + margin:
            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2
            distance = math.hypot(x - center_x, y - center_y)
            candidates.append((path["area"], distance, path))
    if candidates:
        return sorted(candidates, key=lambda item: (item[0], item[1]))[0][2]["angle"]
    return None


def normalize_angle(angle):
    while angle <= -90:
        angle += 180
    while angle > 90:
        angle -= 180
    return angle


def angle_distance(first, second):
    diff = abs(normalize_angle(first - second))
    return min(diff, 180 - diff)


def pca_angle(labels):
    if len(labels) < 2:
        return 0
    mean_x = sum(label["x"] for label in labels) / len(labels)
    mean_y = sum(label["y"] for label in labels) / len(labels)
    sxx = sum((label["x"] - mean_x) ** 2 for label in labels)
    syy = sum((label["y"] - mean_y) ** 2 for label in labels)
    sxy = sum((label["x"] - mean_x) * (label["y"] - mean_y) for label in labels)
    return normalize_angle(0.5 * math.degrees(math.atan2(2 * sxy, sxx - syy)))


def choose_block_angle(block_labels, outline_paths):
    distribution_angle = pca_angle(block_labels)
    outline_angles = [infer_angle(label, outline_paths) for label in block_labels]
    outline_angles = [angle for angle in outline_angles if angle is not None]
    if not outline_angles:
        return distribution_angle

    candidates = []
    for angle in outline_angles:
        candidates.extend([normalize_angle(angle), normalize_angle(angle + 90)])
    return min(candidates, key=lambda angle: angle_distance(angle, distribution_angle))


def axis_for_angle(angle):
    rad = math.radians(angle)
    return (math.cos(rad), math.sin(rad)), (-math.sin(rad), math.cos(rad))


def project(point, axis):
    return point[0] * axis[0] + point[1] * axis[1]


def point_from_axes(u_value, v_value, u_axis, v_axis):
    return (
        u_axis[0] * u_value + v_axis[0] * v_value,
        u_axis[1] * u_value + v_axis[1] * v_value,
    )


def nearby_outline_points(block_labels, outline_paths):
    min_x = min(label["x"] for label in block_labels) - 42
    max_x = max(label["x"] for label in block_labels) + 42
    min_y = min(label["y"] for label in block_labels) - 42
    max_y = max(label["y"] for label in block_labels) + 42
    points = []
    for path in outline_paths:
        path_min_x, path_min_y, path_max_x, path_max_y = path["bbox"]
        if path_max_x < min_x or path_min_x > max_x or path_max_y < min_y or path_min_y > max_y:
            continue
        points.extend(path["points"])
    return points


def cluster_lanes(block_labels, v_axis, lane_threshold):
    sorted_labels = sorted(block_labels, key=lambda label: project((label["x"], label["y"]), v_axis))
    lanes = []
    for label in sorted_labels:
        v_value = project((label["x"], label["y"]), v_axis)
        if not lanes or abs(v_value - lanes[-1]["center"]) > lane_threshold:
            lanes.append({"labels": [label], "center": v_value})
        else:
            lane = lanes[-1]
            lane["labels"].append(label)
            lane["center"] = sum(project((item["x"], item["y"]), v_axis) for item in lane["labels"]) / len(lane["labels"])
    return lanes


def median(values, fallback):
    values = sorted(value for value in values if value > 0)
    if not values:
        return fallback
    return values[len(values) // 2]


def build_units(labels, outline_paths):
    red_paths = [path for path in outline_paths if path["stroke"] in ("#ed1f24", "#cd2027")]
    label_groups = {}
    fallback_labels = []
    for label in labels:
        path = find_containing_path(label, red_paths)
        if path:
            label_groups.setdefault(path["id"], {"path": path, "labels": []})["labels"].append(label)
        else:
            fallback_labels.append(label)

    units = []
    for group in label_groups.values():
        units.extend(build_units_in_outline(group["labels"], group["path"]))

    if not fallback_labels:
        return sort_units(units)

    block_angles = {}
    for block in sorted({block_of(label["unit"]) for label in fallback_labels}):
        angles = [infer_angle(label, outline_paths) for label in fallback_labels if block_of(label["unit"]) == block]
        angles = [angle for angle in angles if angle is not None]
        block_angles[block] = sorted(angles)[len(angles) // 2] if angles else pca_angle([label for label in fallback_labels if block_of(label["unit"]) == block])

    for block in sorted({block_of(label["unit"]) for label in labels}):
        block_labels = [label for label in fallback_labels if block_of(label["unit"]) == block]
        if not block_labels:
            continue
        block_angle = block_angles[block]
        u_axis, v_axis = axis_for_angle(block_angle)
        default_width, default_height = SIZE_BY_BLOCK.get(block, (18, 13))

        values = []
        for label in block_labels:
            values.append({
                **label,
                "u": project((label["x"], label["y"]), u_axis),
                "v": project((label["x"], label["y"]), v_axis),
            })

        u_distances = []
        v_distances = []
        for current in values:
            for other in values:
                if current is other:
                    continue
                du = abs(current["u"] - other["u"])
                dv = abs(current["v"] - other["v"])
                if dv < default_height * 1.15 and du > 1:
                    u_distances.append(du)
                if du < default_width * 1.15 and dv > 1:
                    v_distances.append(dv)

        block_width = min(default_width * 1.5, max(default_width * 0.72, median(u_distances, default_width) * 0.92))
        block_height = min(default_height * 1.45, max(default_height * 0.72, median(v_distances, default_height) * 0.88))

        for label in values:
            angle = infer_angle(label, outline_paths)
            if angle is None or angle_distance(angle, block_angle) > 42:
                angle = block_angle
            local_u_axis, local_v_axis = axis_for_angle(angle)

            width = block_width
            height = block_height
            nearby_u = []
            nearby_v = []
            label_u = project((label["x"], label["y"]), local_u_axis)
            label_v = project((label["x"], label["y"]), local_v_axis)
            for other in values:
                if other is label:
                    continue
                other_u = project((other["x"], other["y"]), local_u_axis)
                other_v = project((other["x"], other["y"]), local_v_axis)
                du = abs(other_u - label_u)
                dv = abs(other_v - label_v)
                if dv < height * 1.05 and du > 1:
                    nearby_u.append(du)
                if du < width * 1.05 and dv > 1:
                    nearby_v.append(dv)
            if nearby_u:
                width = min(width, min(nearby_u) * 0.88)
            if nearby_v:
                height = min(height, min(nearby_v) * 0.86)
            width = max(6.4, width - FALLBACK_UNIT_GAP)
            height = max(6.4, height - FALLBACK_UNIT_GAP)

            half_w = max(3.2, width / 2)
            half_h = max(3.2, height / 2)
            corners = [
                point_from_axes(label_u - half_w, label_v - half_h, local_u_axis, local_v_axis),
                point_from_axes(label_u + half_w, label_v - half_h, local_u_axis, local_v_axis),
                point_from_axes(label_u + half_w, label_v + half_h, local_u_axis, local_v_axis),
                point_from_axes(label_u - half_w, label_v + half_h, local_u_axis, local_v_axis),
            ]
            units.append({**label, "block": block, "points": corners})
    return sort_units(units)


def find_containing_path(label, red_paths):
    x = label["x"]
    y = label["y"]
    candidates = []
    for path in red_paths:
        min_x, min_y, max_x, max_y = path["bbox"]
        margin = 5
        width = max_x - min_x
        height = max_y - min_y
        if width < 8 or height < 8:
            continue
        if min_x - margin <= x <= max_x + margin and min_y - margin <= y <= max_y + margin:
            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2
            distance = math.hypot(x - center_x, y - center_y)
            candidates.append((path["area"], distance, path))
    if not candidates:
        return None
    return sorted(candidates, key=lambda item: (item[0], item[1]))[0][2]


def build_units_in_outline(labels, path):
    if not labels:
        return []
    block = block_of(labels[0]["unit"])
    default_width, default_height = SIZE_BY_BLOCK.get(block, (18, 13))

    first_angle = path["angle"]
    spread_first = projected_spread(labels, first_angle)
    spread_second = projected_spread(labels, normalize_angle(first_angle + 90))
    unit_angle = normalize_angle(first_angle + 90) if spread_second > spread_first * 1.15 else first_angle
    u_axis, v_axis = axis_for_angle(unit_angle)
    path_u_values = [project(point, u_axis) for point in path["points"]]
    path_v_values = [project(point, v_axis) for point in path["points"]]
    path_u_min, path_u_max = min(path_u_values), max(path_u_values)
    path_v_min, path_v_max = min(path_v_values), max(path_v_values)

    values = [{**label, "u": project((label["x"], label["y"]), u_axis), "v": project((label["x"], label["y"]), v_axis)} for label in labels]
    lanes = []
    lane_threshold = max(default_height * 0.58, 7)
    for value in sorted(values, key=lambda item: item["v"]):
        if not lanes or abs(value["v"] - lanes[-1]["center"]) > lane_threshold:
            lanes.append({"labels": [value], "center": value["v"]})
        else:
            lanes[-1]["labels"].append(value)
            lanes[-1]["center"] = sum(item["v"] for item in lanes[-1]["labels"]) / len(lanes[-1]["labels"])

    lane_centers = [lane["center"] for lane in lanes]
    lane_gaps = [b - a for a, b in zip(lane_centers, lane_centers[1:])]
    fallback_lane_height = median(lane_gaps, min(default_height * 1.18, path_v_max - path_v_min))
    units = []

    for lane_index, lane in enumerate(lanes):
        lane_labels = sorted(lane["labels"], key=lambda item: item["u"])
        lane_u = [item["u"] for item in lane_labels]
        lane_gaps_u = [b - a for a, b in zip(lane_u, lane_u[1:])]
        fallback_width = median(lane_gaps_u, min(default_width * 1.25, path_u_max - path_u_min))

        if lane_index == 0:
            v_min = max(path_v_min, lane["center"] - fallback_lane_height / 2)
        else:
            v_min = (lanes[lane_index - 1]["center"] + lane["center"]) / 2

        if lane_index == len(lanes) - 1:
            v_max = min(path_v_max, lane["center"] + fallback_lane_height / 2)
        else:
            v_max = (lane["center"] + lanes[lane_index + 1]["center"]) / 2

        for index, label in enumerate(lane_labels):
            if index == 0:
                u_min = max(path_u_min, label["u"] - fallback_width / 2)
            else:
                u_min = (lane_u[index - 1] + label["u"]) / 2

            if index == len(lane_labels) - 1:
                u_max = min(path_u_max, label["u"] + fallback_width / 2)
            else:
                u_max = (label["u"] + lane_u[index + 1]) / 2

            if u_max - u_min < 5:
                mid = (u_min + u_max) / 2
                u_min = mid - 2.5
                u_max = mid + 2.5
            if v_max - v_min < 5:
                mid = (v_min + v_max) / 2
                v_min = mid - 2.5
                v_max = mid + 2.5
            u_min, u_max, v_min, v_max = inset_unit_bounds(u_min, u_max, v_min, v_max, OUTLINE_UNIT_GAP)

            points = [
                point_from_axes(u_min, v_min, u_axis, v_axis),
                point_from_axes(u_max, v_min, u_axis, v_axis),
                point_from_axes(u_max, v_max, u_axis, v_axis),
                point_from_axes(u_min, v_max, u_axis, v_axis),
            ]
            units.append({**label, "block": block, "points": points})
    return units


def inset_unit_bounds(u_min, u_max, v_min, v_max, gap):
    u_gap = min(gap, max(0, (u_max - u_min) / 2 - 2.6))
    v_gap = min(gap, max(0, (v_max - v_min) / 2 - 2.6))
    return u_min + u_gap, u_max - u_gap, v_min + v_gap, v_max - v_gap


def projected_spread(labels, angle):
    u_axis, _ = axis_for_angle(angle)
    values = [project((label["x"], label["y"]), u_axis) for label in labels]
    return max(values) - min(values) if values else 0


def sort_units(units):
    return sorted(units, key=lambda unit: sort_key({"unit": unit["unit"], "x": unit["x"], "y": unit["y"]}))


def collect_text_labels():
    page = PdfReader(str(SOURCE)).pages[0]
    page_h = float(page.mediabox.height)
    page_w = float(page.mediabox.width)
    items = []

    def visitor(text, cm, tm, font_dict, font_size):
        value = " ".join(text.split())
        if not value:
            return
        x, y = transform_point(cm, float(tm[4]), float(tm[5]))
        display_y = page_h - y
        if -20 <= x <= page_w + 20 and -20 <= display_y <= page_h + 20:
            items.append({"text": value, "x": x, "y": display_y})

    page.extract_text(visitor_text=visitor)
    return items


def merge_split_labels(items):
    labels = []
    index = 0
    while index < len(items):
        item = items[index]
        text = item["text"]
        if re.fullmatch(r"[A-Z]\d+", text):
            labels.append({**item, "unit": text})
            index += 1
            continue

        if re.fullmatch(r"[A-Z]", text):
            digits = []
            scan = index + 1
            while scan < len(items) and len(digits) < 2:
                candidate = items[scan]
                if not re.fullmatch(r"\d", candidate["text"]):
                    break
                if abs(candidate["x"] - item["x"]) > 4.5 or abs(candidate["y"] - item["y"]) > 14:
                    break
                digits.append(candidate)
                scan += 1
            if digits:
                labels.append(
                    {
                        "unit": text + "".join(digit["text"] for digit in digits),
                        "x": sum([item["x"], *[digit["x"] for digit in digits]]) / (len(digits) + 1),
                        "y": sum([item["y"], *[digit["y"] for digit in digits]]) / (len(digits) + 1),
                    }
                )
                index = scan
                continue

        index += 1
    return [label for label in labels if re.fullmatch(r"[A-Z]\d+", label["unit"])]


def sort_key(label):
    match = re.fullmatch(r"([A-Z]+)(\d+)", label["unit"])
    return match.group(1), int(match.group(2)), label["y"], label["x"]


def unique_labels(labels):
    counts = Counter(label["unit"] for label in labels)
    seen = Counter()
    results = []
    for label in sorted(labels, key=sort_key):
        unit = label["unit"]
        seen[unit] += 1
        unit_id = unit if counts[unit] == 1 else f"{unit}-{seen[unit]}"
        results.append({**label, "unitId": unit_id, "unitNo": unit})
    return results


def block_of(unit):
    return re.fullmatch(r"([A-Z]+)\d+(?:-\d+)?", unit).group(1)


def fmt(value):
    return f"{value:.2f}".rstrip("0").rstrip(".")


def main():
    outline_paths = collect_outline_paths()
    labels = unique_labels(merge_split_labels(collect_text_labels()))
    block_angles = {}
    for block in sorted({block_of(label["unit"]) for label in labels}):
        block_labels = [label for label in labels if block_of(label["unit"]) == block]
        block_angles[block] = choose_block_angle(block_labels, outline_paths)
    units = build_units(labels, outline_paths)

    lines = [
        "(function () {",
        "  const polygonUnit = (unitId, unitNo, block, points, labelX, labelY, area = 0) => {",
        "    const xs = points.map(([x]) => x);",
        "    const ys = points.map(([, y]) => y);",
        "",
        "    return {",
        "      unitId,",
        "      unitNo,",
        "      block,",
        "      points,",
        "      labelX,",
        "      labelY,",
        "      x: Math.min(...xs),",
        "      y: Math.min(...ys),",
        "      width: Math.max(...xs) - Math.min(...xs),",
        "      height: Math.max(...ys) - Math.min(...ys),",
        "      area",
        "    };",
        "  };",
        "",
        "  const units = [",
    ]

    unit_lines = []
    for unit in units:
        points = ", ".join(f"[{fmt(x)}, {fmt(y)}]" for x, y in unit["points"])
        unit_lines.append(
            f'    polygonUnit("{unit["unitId"]}", "{unit["unitNo"]}", "{unit["block"]}", '
            f'[{points}], {fmt(unit["x"])}, {fmt(unit["y"])})'
        )
    lines.append(",\n".join(unit_lines))
    lines.extend(["  ];", "", "  window.chaengwattanaUnits = units;", "})();", ""])
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"{OUT}")
    print(f"{len(labels)} units")
    print("angles", ", ".join(f"{block}:{fmt(angle)}" for block, angle in block_angles.items()))
    print(", ".join(label["unitId"] for label in labels))


if __name__ == "__main__":
    main()
