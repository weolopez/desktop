export class WallpaperManager {
    constructor(desktopComponent) {
        this.desktopComponent = desktopComponent;
        this.wallpaper = localStorage.getItem('desktop-wallpaper') || 'gradient';
    }

    changeWallpaper() {
        const wallpapers = ['gradient', 'monterey', 'big-sur'];
        const currentIndex = wallpapers.indexOf(this.wallpaper);
        const nextIndex = (currentIndex + 1) % wallpapers.length;
        const newWallpaper = wallpapers[nextIndex];
        
        this.wallpaper = newWallpaper;
        localStorage.setItem('desktop-wallpaper', newWallpaper);
        this.desktopComponent.updateWallpaperClass(this.wallpaper);
    }
}