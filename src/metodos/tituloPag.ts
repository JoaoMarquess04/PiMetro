import { useEffect } from 'react';

function tituloPag(titulo: string) {
    useEffect(() => {
        document.title = titulo;
      }, [titulo]);
}

export default tituloPag;