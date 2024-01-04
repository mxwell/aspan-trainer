#! /usr/bin/python3

import argparse
from bs4 import BeautifulSoup
import logging
import os


def main():
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Modify scrapped viewer page to produce a prerendered version.")
    parser.add_argument("--input", "-i", type=str, required=True, help="HTML file path")
    parser.add_argument("--root", type=str, help="URL root, schema + host + port")
    args = parser.parse_args()

    scrapped_path = args.input
    base_name = os.path.basename(scrapped_path)
    noext_name = os.path.splitext(base_name)[0]
    additional_files = f"{noext_name}_files"

    def strip_directory_name(link):
        if link.startswith(additional_files):
            modification = link[len(additional_files):]
            logging.info("Changing link: %s -> %s", link, modification)
            return True, modification
        return False, None

    url_root = args.root

    def strip_url_root(link):
        if link.startswith(url_root):
            modification = link[len(url_root):]
            logging.info("Changing link: %s -> %s", link, modification)
            return True, modification
        return False, None

    def strip_link(link):
        modified, modification = strip_directory_name(link)
        if modified:
            return modified, modification
        return strip_url_root(link)

    try:
        with open(scrapped_path, "r", encoding="utf-8") as file:
            html_content = file.read()

            soup = BeautifulSoup(html_content, "lxml")

            # Remove existing noscript tag.
            old_noscript = soup.find("noscript")
            if old_noscript:
                old_noscript.decompose()

            # Fix links
            for link in soup.find_all("link"):
                modified, modification = strip_link(link["href"])
                if modified:
                    link["href"] = modification

            for script in soup.find_all("script"):
                modified, modification = strip_link(script["src"])
                if modified:
                    script["src"] = modification

            viewer_root = soup.find("div", id="viewer_root")

            if viewer_root:
                # Wrap the div with noscript tag.
                noscript = soup.new_tag("noscript")
                for item in viewer_root.contents:
                    noscript.append(item)
                viewer_root.clear()
                viewer_root.append(noscript)
                print(soup)
            else:
                logging.error("No div with id 'viewer_root' found in the provided HTML.")

    except FileNotFoundError:
        logging.error("The file at %s was not found.", scrapped_path)
    except Exception as e:
        logging.error("An error occurred: %e", e)


if __name__ == '__main__':
    main()