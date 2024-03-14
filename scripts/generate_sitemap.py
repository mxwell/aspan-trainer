#! /usr/bin/python3

"""
Usage example:

 python3 scripts/generate_sitemap.py --host https://kazakhverb.khairulin.com --input-directory ssr/output --lastmod 2024-03-15

"""

import argparse
from dataclasses import dataclass, field
import logging
from lxml import etree
import os
from typing import List
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


@dataclass
class WebsiteInfo:
    main_url: str
    lastmod: str
    languages: List[str] = field(default_factory=list)
    alternates: List[str] = field(default_factory=list)


def make_ssr_urls(prefix, html_names, lastmod):
    result = []
    for name in html_names:
        escaped = urllib.parse.quote(name)
        result.append(WebsiteInfo(f"{prefix}/ssr/{escaped}", lastmod))
    return result


def make_spa_urls(host, prefix_by_language, main_language, html_names, lastmod):
    result = []

    def make_url(escaped_verb, language):
        prefix = prefix_by_language[language]
        return f"{host}/{prefix}?verb={escaped_verb}"

    for name in html_names:
        if not name.endswith(".html"):
            continue
        verb = name[:-5].replace("_", " ")
        escaped = urllib.parse.quote_plus(verb)
        assert main_language in prefix_by_language
        main_url = make_url(escaped, main_language)
        languages = []
        alternates = []
        for language, prefix in prefix_by_language.items():
            if language == main_language:
                continue
            languages.append(language)
            alternates.append(make_url(escaped, language))
        result.append(WebsiteInfo(main_url, lastmod, languages, alternates))
    return result


def make_meta_urls(host, suffix_by_language, main_language, lastmod):
    result = []
    pages = ["about", "timeline"]

    def make_page_url(page, language):
        suffix = suffix_by_language[language]
        return f"{host}/{page}_{suffix}.html"

    for page in pages:
        main_url = make_page_url(page, main_language)
        languages = []
        alternates = []
        for language in suffix_by_language:
            if language == main_language:
                continue
            languages.append(language)
            alternates.append(make_page_url(page, language))
        result.append(WebsiteInfo(main_url, lastmod, languages, alternates))
    return result


def generate_sitemap(url_list):
    namespaces = {
        "xhtml": "http://www.w3.org/1999/xhtml",
    }
    # for prefix, uri in namespaces.items():
    #    etree.register_namespace(prefix, uri)

    urlset = etree.Element(
        "urlset",
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9",
        nsmap=namespaces
    )

    # Iterate over URLs
    for website_info in url_list:
        # Create a new element for each URL
        url_element = etree.SubElement(urlset, "url")
        loc = etree.SubElement(url_element, "loc")
        loc.text = website_info.main_url

        lastmod = etree.SubElement(url_element, "lastmod")
        lastmod.text = website_info.lastmod

        changefreq = etree.SubElement(url_element, "changefreq")
        changefreq.text = "monthly"

        alternates_count = len(website_info.alternates)
        for i in range(alternates_count):
            language = website_info.languages[i]
            alternate = website_info.alternates[i]
            xhtml_link = etree.SubElement(
                url_element,
                "{http://www.w3.org/1999/xhtml}link",
                rel="alternate",
                hreflang=language,
                href=alternate
            )

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
    parser.add_argument("--host", type=str, required=True, help="Host name for the website")
    parser.add_argument("--input-directory", "-i", type=str, required=True, help="Directory with HTML pages to put into sitemap")
    parser.add_argument("--lastmod", type=str, default="2024-01-14", help="A string like 2024-01-14 to use as URLs lastmod")
    args = parser.parse_args()

    prefix_by_language = dict(
        en="en/",
        kk="kk/",
        ru="",
    )
    suffix_by_language = dict(
        en="en",
        kk="kk",
        ru="ru",
    )
    main_language = "ru"

    html_names = collect_html_names(args.input_directory)
    urls = []
    # urls += make_ssr_urls(prefix_by_language[main_language], html_names, "2024-01-14")
    urls += make_spa_urls(args.host, prefix_by_language, main_language, html_names, args.lastmod)
    urls += make_meta_urls(args.host, suffix_by_language, main_language, args.lastmod)
    generate_sitemap(urls)


if __name__ == '__main__':
    main()