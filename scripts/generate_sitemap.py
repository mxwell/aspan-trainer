#! /usr/bin/python3

import argparse
from dataclasses import dataclass, field
import logging
from lxml import etree
import os
from typing import List
import urllib.parse


@dataclass
class VerbInfo:
    text: str
    fe: bool


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


def make_spa_urls(host, prefix_by_language, main_language, verbs, lastmod):
    result = []

    def make_url(escaped_verb, fe, language):
        prefix = prefix_by_language[language]
        if fe:
            fe_part = "&exception=true"
        else:
            fe_part = ""
        return f"{host}/{prefix}?verb={escaped_verb}{fe_part}"

    for verb in verbs:
        escaped = urllib.parse.quote(verb.text)
        assert main_language in prefix_by_language
        main_url = make_url(escaped, verb.fe, main_language)
        languages = []
        alternates = []
        for language, prefix in prefix_by_language.items():
            if language == main_language:
                continue
            languages.append(language)
            alternates.append(make_url(escaped, verb.fe, language))
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


def collect_verbs(verbs_path):
    result = []
    for line in open(verbs_path):
        parts = line.strip().split("\t")
        assert len(parts) >= 2
        assert len(parts[0]) > 0
        fe_part = parts[1]
        assert fe_part == "0" or fe_part == "1"
        result.append(VerbInfo(parts[0], fe_part == "1"))
    logging.info("Loaded %d verbs", len(result))
    return result


def main():
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Prepare sitemap data from a list of verbs")
    parser.add_argument("--host", type=str, required=True, help="Host name for the website")
    parser.add_argument("--verbs-path", type=str, required=True, help="Path to verbs file")
    parser.add_argument("--lastmod", type=str, default="2024-01-14", help="A string like 2024-01-14 to use as URLs lastmod")
    args = parser.parse_args()

    main_language = "ru"
    alt_langs = ["en", "kk"]

    def make_section(templ):
        ru = templ.format(args.host, "ru")
        alts = [templ.format(args.host, lang) for lang in alt_langs]
        return WebsiteInfo(ru, args.lastmod, alt_langs, alts)

    section_paths = [
        WebsiteInfo("{}/".format(args.host), args.lastmod, alt_langs, ["{}/en".format(args.host), "{}/kk".format(args.host)]),
        # make_section("{}/verb_detector_{}.html"),
        # make_section("{}/declension_{}.html"),
        make_section("{}/present_top_{}.html"),
        # make_section("{}/verb_gym_{}.html"),
        make_section("{}/timeline_{}.html"),
        make_section("{}/about_{}.html"),
    ]

    prefix_by_language = dict(
        en="en/",
        kk="kk/",
        ru="",
    )

    verbs = collect_verbs(args.verbs_path)
    urls = section_paths
    urls += make_spa_urls(args.host, prefix_by_language, main_language, verbs, args.lastmod)
    generate_sitemap(urls)


if __name__ == '__main__':
    main()