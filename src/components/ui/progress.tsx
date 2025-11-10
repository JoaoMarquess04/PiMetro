type ProgressProps = {
    progress?: number
}

function Progress({ progress = 0 }: ProgressProps) {
    return (
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]" >
                        {progress.toFixed(2)}%
                    </span>
                </div>
        </div>
    )
}

export default Progress