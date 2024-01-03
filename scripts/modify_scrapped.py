#! /usr/bin/python3

import argparse
from bs4 import BeautifulSoup
import logging


def main():
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Modify scrapped viewer page to produce a prerendered version.")
    parser.add_argument("--input", "-i", type=str, required=True, help="HTML file path")
    args = parser.parse_args()

    scrapped_path = args.input

    try:
        with open(scrapped_path, "r", encoding="utf-8") as file:
            html_content = file.read()

            soup = BeautifulSoup(html_content, "lxml")

            # Remove existing noscript tag.
            old_noscript = soup.find("noscript")
            if old_noscript:
                old_noscript.decompose()

            viewer_root = soup.find("div", id="viewer_root")

            if viewer_root:
                # Wrap the div with noscript tag.
                noscript = soup.new_tag("noscript")
                viewer_root.replace_with(noscript)
                noscript.append(viewer_root)
                print(soup.prettify())
            else:
                logging.error("No div with id 'viewer_root' found in the provided HTML.")

    except FileNotFoundError:
        logging.error("The file at %s was not found.", scrapped_path)
    except Exception as e:
        logging.error("An error occurred: %e", e)


if __name__ == '__main__':
    main()