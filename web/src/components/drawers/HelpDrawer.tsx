export function HelpDrawer() {
  return (
    <div className="space-y-4 p-4">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Drawing Tools</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li><kbd className="rounded bg-muted px-1">B</kbd> Brush - Paint individual cells</li>
          <li><kbd className="rounded bg-muted px-1">R</kbd> Rectangle - Click and drag</li>
          <li><kbd className="rounded bg-muted px-1">C</kbd> Circle/Oval - Click and drag</li>
          <li><kbd className="rounded bg-muted px-1">L</kbd> Line - Click start to end</li>
          <li><kbd className="rounded bg-muted px-1">P</kbd> Polygon - Click vertices, double-click to close</li>
          <li><kbd className="rounded bg-muted px-1">E</kbd> Eraser - Remove materials</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Navigation</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li><kbd className="rounded bg-muted px-1">Scroll</kbd> Zoom in/out</li>
          <li><kbd className="rounded bg-muted px-1">Middle-click drag</kbd> Pan</li>
          <li><kbd className="rounded bg-muted px-1">Space + drag</kbd> Pan</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Shortcuts</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li><kbd className="rounded bg-muted px-1">Ctrl+Z</kbd> Undo</li>
          <li><kbd className="rounded bg-muted px-1">Ctrl+Shift+Z</kbd> Redo</li>
          <li><kbd className="rounded bg-muted px-1">Ctrl+S</kbd> Save design</li>
          <li><kbd className="rounded bg-muted px-1">F</kbd> Toggle fill/outline mode</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Widgets</h3>
        <p className="text-sm text-muted-foreground">
          Drag prefab objects from the Widgets panel onto the canvas.
          Click a placed object to select it, then resize or rotate using handles.
          Press <kbd className="rounded bg-muted px-1">Delete</kbd> to remove.
        </p>
      </section>
    </div>
  )
}
