export function StatusBar() {
  const currentTime = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center text-sm">
      <div className="flex items-center space-x-2">
        <span className="material-icons text-lg">signal_cellular_4_bar</span>
        <span className="material-icons text-lg">wifi</span>
        <span className="material-icons text-lg">battery_full</span>
      </div>
      <span>{currentTime}</span>
    </div>
  );
}
