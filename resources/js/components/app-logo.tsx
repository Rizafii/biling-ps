import AppLogoIcon from "./app-logo-icon";

export default function AppLogo() {
    return (
        <>
            <div className="flex w-full items-center text-start space-x-2">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                <p className="text-xl font-semibold">Smart Switch</p>
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                {/* <span className="mb-0.5 truncate leading-tight font-semibold">Laravel Starter Kit</span> */}
            </div>
        </>
    );
}
