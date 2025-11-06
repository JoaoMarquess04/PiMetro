import { Children, type ReactNode } from 'react';

function Contador({ children }: { children?: ReactNode }) {
  const count = Children.count(children);

  return (
    <div>
      {children}
    </div>
  );
}

export default Contador;