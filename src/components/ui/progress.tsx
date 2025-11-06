type ProgressProps = {
    progress?: number
}

function Progress({ progress = 0 }: ProgressProps) {
    return (
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white z-10">
                        {progress}%
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Progress