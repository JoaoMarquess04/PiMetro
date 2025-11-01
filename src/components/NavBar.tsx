import { useState } from 'react'
import Botao from './ui/botao'
import logo from '../assets/metro.svg'

function Navbar() {
    const [activeIndex, setActiveIndex] = useState<number | null>(0)

    return (
        <div className="border-r-1 border-gray-200 w-60 min-h-screen bg-gray-100">

            <div className="flex">
                <img src={logo} alt="Metro logo" className="w-10"/>
                <div className='bg-[#001489] w-[100%]'></div>
            </div>

            <div className="w-60">
                <div className="px-2 font-bold text-sm py-1 text-gray-600">Menu</div>
                <nav className="px-2">
                    <ul>
                        <li>
                            <Botao icone="house" texto="Dashboard" isActive={activeIndex === 0} onSelect={() => setActiveIndex(0)}/>
                        </li>
                        <li>
                            <Botao icone="upload" texto="Upload" isActive={activeIndex === 1} onSelect={() => setActiveIndex(1)}/>
                        </li>
                        <li>
                            <Botao icone="wrench" texto="Obras" isActive={activeIndex === 2} onSelect={() => setActiveIndex(2)}/>
                        </li>
                        <li>
                            <Botao icone="gear" texto="Configurações" isActive={activeIndex === 3} onSelect={() => setActiveIndex(3)}/>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default Navbar