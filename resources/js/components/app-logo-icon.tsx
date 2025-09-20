import { Gamepad2 } from 'lucide-react';
import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <div className="p-2 bg-primary rounded-lg">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
        </div>
    );
}
