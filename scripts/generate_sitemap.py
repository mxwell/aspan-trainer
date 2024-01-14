#! /usr/bin/python3

import argparse
import logging
from lxml import etree
import os
import urllib.parse


def collect_html_names(input_directory):
    result = []
    for item in os.scandir(input_directory):
        if not item.is_file():
            continue
        if not item.name.endswith(".html"):
            continue
        result.append(item.name)
    return result


def make_ssr_urls(prefix, html_names):
    result = []
    for name in html_names:
        escaped = urllib.parse.quote(name)
        result.append(f"{prefix}/ssr/{escaped}")
    return result


def make_spa_urls(prefix, html_names):
    result = []
    for name in html_names:
        if not name.endswith(".html"):
            continue
        verb = name[:-5].replace("_", " ")
        escaped = urllib.parse.quote_plus(verb)
        result.append(f"{prefix}/?verb={escaped}")
    return result


def generate_sitemap(url_list):
    urlset = etree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    # Iterate over URLs
    for url in url_list:
        # Create a new element for each URL
        url_element = etree.SubElement(urlset, "url")
        loc = etree.SubElement(url_element, "loc")
        loc.text = url

        lastmod = etree.SubElement(url_element, "lastmod")
        lastmod.text = "2024-01-14"

        changefreq = etree.SubElement(url_element, "changefreq")
        changefreq.text = "monthly"

        # priority = etree.SubElement(url_element, "priority")
        # priority.text = "0.5"  # Example priority

    # Convert the tree to a byte string
    sitemap = etree.tostring(urlset, pretty_print=True, xml_declaration=True, encoding='UTF-8')

    # Write to a file
    with open("sitemap.xml", "wb") as f:
        f.write(sitemap)


def main():
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Modify scrapped viewer page to produce a prerendered version.")
    parser.add_argument("--url-prefix", type=str, required=True, help="URL prefix, goes before HTML file name")
    parser.add_argument("--input-directory", "-i", type=str, required=True, help="Directory with HTML pages to put into sitemap")
    args = parser.parse_args()

    html_names = collect_html_names(args.input_directory)
    urls = make_ssr_urls(args.url_prefix, html_names)
    urls += make_spa_urls(args.url_prefix, html_names)
    generate_sitemap(urls)


if __name__ == '__main__':
    main()