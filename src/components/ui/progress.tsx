type ProgressProps = {
    progress?: number
}

function Progress({ progress = 0 }: ProgressProps) {
    return (
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300" 
                style={{ width: `${progress}%` }}>

            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                    {progress.toFixed(2)}%
                </span>
            </div>
                </div>
        </div>
    )
}

export default Progress