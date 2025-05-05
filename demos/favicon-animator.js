/**
 * @file favicon-animator.js
 * @description Animates the favicon by rotating a base image using canvas rendering.
 * @author Scott Mitting
 */

class FaviconAnimator {
  /**
   * Creates a new FaviconAnimator instance.
   * @param {Object} options - Configuration options.
   * @param {number} options.size - Width and height of the favicon in pixels.
   * @param {number} options.frameCount - Number of frames per rotation cycle.
   * @param {number} options.animFps - How quickly to advance frames
   * @param {string} options.imageSrc - Source path for the base favicon image.
   */
  constructor({ size = 64, frameCount = 20, animFps = 30, imageSrc = '/favicon.ico' } = {}) {
    this.size = size;
    this.frameCount = frameCount;
    this.animFps = animFps;
    this.imageSrc = imageSrc;
    this.frames = [];
    this.frameIndex = 0;
    this.intervalMs = 1000.0 / this.animFps;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d');

    this.faviconLink = document.createElement('link');
    this.faviconLink.id = 'dynamic-favicon';
    this.faviconLink.rel = 'icon';
    document.head.appendChild(this.faviconLink);

    this.image = new Image();
    this.image.src = this.imageSrc;
    this.image.onload = () => this._onImageLoad();
  }

  /**
   * Handles the image load event by generating frames and starting animation.
   * @private
   */
  _onImageLoad() {
    this._generateFrames();
    this._startAnimation();
  }

  /**
   * Generates rotated frames of the favicon image and stores them as data URLs.
   * @private
   */
  _generateFrames() {
    const deltaAngle = 360 / this.frameCount;

    for (let i = 0; i < this.frameCount; i++) {
      const angle = i * deltaAngle;
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = this.size;
      frameCanvas.height = this.size;
      const frameCtx = frameCanvas.getContext('2d');

      frameCtx.save();
      frameCtx.translate(this.size / 2, this.size / 2);
      frameCtx.rotate((angle * Math.PI) / 180);
      frameCtx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
      frameCtx.restore();

      this.frames.push(frameCanvas.toDataURL('image/png'));
    }
  }

  /**
   * Starts the animation loop by cycling through frames at set intervals.
   * @private
   */
  _startAnimation() {
    let frameIndex = 0;
    setInterval(() => {
      this.faviconLink.href = this.frames[frameIndex];
      frameIndex = (frameIndex + 1) % this.frameCount;
    }, this.intervalMs);
  }
}

// Initialize the animator
new FaviconAnimator({
  size: 64,
  frameCount: 5,
  animFps: 10, 
  imageSrc: '/favicon.ico' // Reference to the default favicon location
});
