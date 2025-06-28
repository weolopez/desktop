export class WallpaperManager {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.wallpaper = localStorage.getItem('desktop-wallpaper') || 'default-gradient';
        this.updateWallpaperClass();
    }

    changeWallpaper() {
        const wallpapers = ['gradient', 'monterey', 'big-sur'];
        const currentWallpaper = this.wallpaper.replace('default-', '');
        const currentIndex = wallpapers.indexOf(currentWallpaper);
        const nextIndex = (currentIndex + 1) % wallpapers.length;
        const newWallpaper = wallpapers[nextIndex];
        
        this.wallpaper = newWallpaper;
        localStorage.setItem('desktop-wallpaper', newWallpaper);
        this.updateWallpaperClass();
    }

    updateWallpaperClass() {
        const background = this.shadowRoot.querySelector('.desktop-background');
        if (background) {
            background.className = `desktop-background wallpaper-${this.wallpaper}`;
        }
    }
}