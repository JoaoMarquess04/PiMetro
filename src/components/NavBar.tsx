import { useMemo } from 'react'
import Botao from './ui/botao'
import logo from '../assets/metro.svg'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const { pathname } = useLocation()

    const activeIndex = useMemo(() => {
        if (pathname === '/dashboard') return 0
        if (pathname === '/casos') return 1
        if (pathname === '/configuracoes') return 2
        return null
    }, [pathname])

    return (
        <div className="sticky border-r-1 border-gray-200 w-60 min-h-screen bg-gray-100">
            <div className="flex">
                <img src={logo} alt="Metro logo" className="w-10" />
                <div className='bg-[#001489] w-[100%]'></div>
            </div>

            <div className="w-60">
                <div className="px-2 font-bold text-sm py-1 text-gray-600">Menu</div>
                <nav className="px-2">
                    <ul>
                        <li>
                            <Link to="/dashboard">
                                <Botao icone="house" texto="Dashboard" isActive={activeIndex === 0} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/casos">
                                <Botao icone="wrench" texto="Casos" isActive={activeIndex === 1} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/configuracoes">
                                <Botao icone="gear" texto="Configurações" isActive={activeIndex === 2} />
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default Navbar