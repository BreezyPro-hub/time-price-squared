export const PINE_SCRIPT = `//@version=5
indicator("TTS Square — Time Price Square + Cycles", overlay=true, max_boxes_count=64, max_lines_count=200, max_labels_count=80)

// ── Inputs
pivotLeft       = input.int(5, "Pivot left", minval=2, maxval=20, group="Pivots")
pivotRight      = input.int(5, "Pivot right", minval=2, maxval=20, group="Pivots")
atrLen          = input.int(14, "ATR length", minval=5, group="Scale")
atrMult         = input.float(0.5, "Price unit (ATR ×)", minval=0.1, step=0.05, group="Scale")
sqTol           = input.float(0.12, "Square tolerance", minval=0.02, maxval=0.4, step=0.01, group="Squares")
showSquares     = input.bool(true, "Time-price squares", group="Squares")
showForming     = input.bool(true, "Forming square", group="Squares")
showCycles      = input.bool(true, "Time cycles", group="Cycles")
cyc45           = input.bool(true, "45", inline="c", group="Cycles")
cyc90           = input.bool(true, "90", inline="c", group="Cycles")
cyc144          = input.bool(true, "144", inline="c", group="Cycles")
cyc180          = input.bool(true, "180", inline="c", group="Cycles")
cyc270          = input.bool(true, "270", inline="c", group="Cycles")
cyc360          = input.bool(true, "360", inline="c", group="Cycles")
showSo9         = input.bool(true, "Square of 9 levels", group="Square of 9")
showAngles      = input.bool(true, "1×1 / 2×1 / 1×2 angles", group="Angles")
showTable       = input.bool(true, "Decision table", group="UI")

var int[]   pivIdx  = array.new_int()
var float[] pivPx   = array.new_float()
var int[]   pivTyp  = array.new_int() // 1 = low, -1 = high

ph = ta.pivothigh(high, pivotLeft, pivotRight)
pl = ta.pivotlow(low, pivotLeft, pivotRight)
if not na(ph)
    array.push(pivIdx, bar_index - pivotRight)
    array.push(pivPx, ph)
    array.push(pivTyp, -1)
if not na(pl)
    array.push(pivIdx, bar_index - pivotRight)
    array.push(pivPx, pl)
    array.push(pivTyp, 1)
for i = 0 to 7
    if array.size(pivIdx) > 16
        array.shift(pivIdx)
        array.shift(pivPx)
        array.shift(pivTyp)

priceUnit = ta.atr(atrLen) * atrMult
priceUnit := nz(priceUnit, syminfo.mintick * 10)

upCol   = color.new(#4ead7a, 78)
dnCol   = color.new(#c45c5c, 78)
upBord  = color.new(#4ead7a, 20)
dnBord  = color.new(#c45c5c, 20)
cycCol  = color.new(#9aa3b2, 55)
so9Col  = color.new(#c8ccd4, 70)
angCol  = color.new(#eceef2, 72)

// ── Completed squares (scan last confirmed pivots)
if showSquares and barstate.islast and array.size(pivIdx) > 0
    n = array.size(pivIdx)
    for p = math.max(0, n - 8) to n - 1
        i0 = array.get(pivIdx, p)
        px = array.get(pivPx, p)
        ty = array.get(pivTyp, p)
        bestEff = 0.0
        bestBar = i0
        bestPx  = px
        for i = i0 + 4 to bar_index
            ext = ty == 1 ? high[bar_index - i] : low[bar_index - i]
            move = math.abs(ext - px)
            pUnits = move / math.max(priceUnit, syminfo.mintick)
            tBars = i - i0
            denom = math.max(tBars, pUnits)
            ratio = math.abs(pUnits - tBars) / denom
            if ratio <= sqTol and pUnits >= 2
                eff = 1.0 - ratio
                if eff > bestEff
                    bestEff := eff
                    bestBar := i
                    bestPx := ext
        if bestEff > 0
            top = math.max(px, bestPx)
            bot = math.min(px, bestPx)
            box.new(i0, top, bestBar, bot, border_color = ty == 1 ? upBord : dnBord, bgcolor = ty == 1 ? upCol : dnCol, border_width = 1)

// ── Forming square from last pivot
var box formBox = na
var line formTgt = na
if showForming and barstate.islast and array.size(pivIdx) > 0
    p  = array.size(pivIdx) - 1
    i0 = array.get(pivIdx, p)
    px = array.get(pivPx, p)
    ty = array.get(pivTyp, p)
    ext = ty == 1 ? high : low
    move = math.abs(ext - px)
    pUnits = move / math.max(priceUnit, syminfo.mintick)
    tBars = bar_index - i0
    need = math.max(tBars, math.round(pUnits))
    tgt  = ty == 1 ? px + need * priceUnit : px - need * priceUnit
    top  = math.max(px, ext, tgt)
    bot  = math.min(px, ext, tgt)
    if not na(formBox)
        box.delete(formBox)
    if not na(formTgt)
        line.delete(formTgt)
    formBox := box.new(i0, top, i0 + int(need), bot, border_color = color.new(#c8ccd4, 35), bgcolor = color.new(#c8ccd4, 92), border_style = line.style_dashed, border_width = 1)
    formTgt := line.new(i0, tgt, i0 + int(need), tgt, color = color.new(#c8ccd4, 20), style = line.style_dotted)

// ── Time cycles from last 3 pivots
if showCycles and barstate.islast and array.size(pivIdx) > 0
    cycs = array.new_int()
    if cyc45
        array.push(cycs, 45)
    if cyc90
        array.push(cycs, 90)
    if cyc144
        array.push(cycs, 144)
    if cyc180
        array.push(cycs, 180)
    if cyc270
        array.push(cycs, 270)
    if cyc360
        array.push(cycs, 360)
    n = array.size(pivIdx)
    for p = math.max(0, n - 3) to n - 1
        i0 = array.get(pivIdx, p)
        for k = 0 to array.size(cycs) - 1
            bars = array.get(cycs, k)
            x = i0 + bars
            line.new(x, low * 0.5, x, high * 1.5, color = cycCol, style = line.style_dotted, extend = extend.both)
            label.new(x, high, str.tostring(bars), style = label.style_none, textcolor = color.new(#c8ccd4, 10), size = size.tiny)

// ── Square of 9 from last pivot + last close
so9(root, deg, dir) =>
    math.pow(math.sqrt(math.max(root, 0.0001)) + dir * deg / 180.0, 2)

if showSo9 and barstate.islast and array.size(pivIdx) > 0
    root = array.get(pivPx, array.size(pivPx) - 1)
    degs = array.from(45, 90, 180, 270, 360)
    for k = 0 to array.size(degs) - 1
        d = array.get(degs, k)
        line.new(bar_index - 40, so9(root, d, 1), bar_index + 8, so9(root, d, 1), color = so9Col, style = line.style_dotted)
        line.new(bar_index - 40, so9(root, d, -1), bar_index + 8, so9(root, d, -1), color = so9Col, style = line.style_dotted)

// ── Gann angles from last pivot
if showAngles and barstate.islast and array.size(pivIdx) > 0
    p  = array.size(pivIdx) - 1
    i0 = array.get(pivIdx, p)
    px = array.get(pivPx, p)
    ty = array.get(pivTyp, p)
    sign = ty
    for [rise, run] in array.from(array.from(1, 1), array.from(2, 1), array.from(1, 2))
        y1 = px
        y2 = px + sign * ((bar_index - i0) * priceUnit * rise) / run
        line.new(i0, y1, bar_index, y2, color = angCol, style = rise == 1 and run == 1 ? line.style_solid : line.style_dashed)

// ── Decision table
if showTable and barstate.islast
    var table tb = table.new(position.top_right, 2, 6, bgcolor = color.new(#12141a, 12), border_color = color.new(#eceef2, 86), border_width = 1)
    formingPct = 0.0
    if array.size(pivIdx) > 0
        p  = array.size(pivIdx) - 1
        i0 = array.get(pivIdx, p)
        px = array.get(pivPx, p)
        ty = array.get(pivTyp, p)
        ext = ty == 1 ? high : low
        pUnits = math.abs(ext - px) / math.max(priceUnit, syminfo.mintick)
        tBars = bar_index - i0
        formingPct := 100.0 * math.min(tBars, pUnits) / math.max(tBars, pUnits, 1)
    table.cell(tb, 0, 0, "TTS SQUARE", text_color = color.white, text_size = size.small)
    table.cell(tb, 1, 0, "Time = Price", text_color = color.new(#c8ccd4, 0), text_size = size.small)
    table.cell(tb, 0, 1, "Price unit", text_color = color.gray, text_size = size.tiny)
    table.cell(tb, 1, 1, str.tostring(priceUnit, format.mintick), text_color = color.white, text_size = size.tiny)
    table.cell(tb, 0, 2, "Square %", text_color = color.gray, text_size = size.tiny)
    table.cell(tb, 1, 2, str.tostring(formingPct, "#.0") + "%", text_color = color.white, text_size = size.tiny)
    table.cell(tb, 0, 3, "Last pivot", text_color = color.gray, text_size = size.tiny)
    table.cell(tb, 1, 3, array.size(pivIdx) > 0 ? (array.get(pivTyp, array.size(pivTyp) - 1) == 1 ? "LOW" : "HIGH") : "—", text_color = color.white, text_size = size.tiny)

alertcondition(true, "TTS Square loaded", "TTS Square is running. Add custom alerts on square completion from the dashboard.")
`;
