function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--';
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
    const secs = String(safeSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function PracticeTimer({remainingSeconds, timeLimitSeconds, isActive, timedOut}) {
    const limit = timeLimitSeconds || 0;
    const remaining = remainingSeconds ?? limit;
    let tone = 'practice-timer--safe';

    if (timedOut) {
        tone = 'practice-timer--danger';
    } else if (limit > 0 && remaining <= 15 && isActive) {
        tone = 'practice-timer--warning';
    }

    return (
        <div className={`practice-timer ${tone}`} aria-live="polite">
            <span className="practice-timer__value">{formatTime(remaining)}</span>
        </div>
    );
}

export default PracticeTimer;