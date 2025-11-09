import Container from "./ui/container.tsx";
import Form from "./ui/form.tsx";
import Upload from "./ui/upload.tsx";

function PopUp({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="relative w-250 items-center flex flex-col justify-center">

                <div onClick={(e) => e.stopPropagation()} className="w-full relative overfl">
                    <button onClick={onClose} className="absolute -top-3 -right-3 bg-red-500 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-[51]">
                        <i className="fa-solid fa-x text-white" />
                    </button>
                    <Container titulo="Upload">
                        <div className="relative bg-white rounded-lg p-6 z-[51] overflow-y-auto max-h-[80vh] space-y-6">                      
                            <Form onDone={onClose} />
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default PopUp;