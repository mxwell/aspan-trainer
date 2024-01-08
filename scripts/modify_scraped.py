#! /usr/bin/python3

import argparse
from bs4 import BeautifulSoup
import logging
import os
import urllib.parse


def modify_html(input_path, output_path, url_root):
    if os.path.exists(output_path):
        logging.warning("Path %s already exists, skipping modification of %s", output_path, input_path)
        return

    base_name = os.path.basename(input_path)

    noext_name = os.path.splitext(base_name)[0]
    encoded_name = urllib.parse.quote(noext_name)
    additional_files = f"{encoded_name}_files"

    def strip_directory_name(link):
        if link.startswith(additional_files):
            modification = link[len(additional_files):]
            logging.info("Changing link: %s -> %s", link, modification)
            return True, modification
        return False, None

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
        with open(input_path, "r", encoding="utf-8") as file:
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
                with open(output_path, "w", encoding="utf-8") as output:
                    output.write(str(soup))
                logging.info("Modification of %s is stored to %s", input_path, output_path)
            else:
                logging.error("No div with id 'viewer_root' found in %s", input_path)

    except FileNotFoundError:
        logging.error("The file at %s was not found.", input_path)
    except Exception as e:
        logging.error("An error occurred: %e", e)


def main():
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Modify scrapped viewer page to produce a prerendered version.")
    parser.add_argument("--input-directory", "-i", type=str, required=True, help="Directory with HTML to modify")
    parser.add_argument("--root", type=str, help="URL root, schema + host + port")
    parser.add_argument("--output-directory", "-o", type=str, required=True, help="Directory to store modified HTMLs")
    args = parser.parse_args()

    name_suffix = " – Kazakh Verb.html"

    for input_item in os.scandir(args.input_directory):
        if not input_item.is_file():
            continue
        name = input_item.name
        if not name.endswith(".html"):
            continue
        output_name = name
        if output_name.endswith(name_suffix):
            output_name = f"{output_name[:-len(name_suffix)]}.html"
        assert "–" not in output_name
        output_path = os.path.join(args.output_directory, output_name)
        modify_html(input_item.path, output_path, args.root)


if __name__ == '__main__':
    main()