## How to build

Prepare image. This needs to be done once.

1. Run docker: `make build_image`

Run the image in a container and build stuff:

1. Run docker: `make builder`
2. Build: `./build_web.sh`
3. Find build output inside `dist`.

### Development build

Set variable: `export NODE_ENV=development`

After that tailwind classes won't be purged and correspondingly CSS files are going to be much larger, like over 1 MB. But it allows to experiment with classes without rebuild.
