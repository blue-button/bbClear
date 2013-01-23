#!/usr/bin/env python

"""
Blue Button Build Script
Copyright 2013 by M. Jackson Wilkinson <jackson@jounce.net>

Running this script polls the build/ folder for changes and compiles the template
in the directory that holds this script.

Requirements:
- Python (2.6 or higher; untested on 3.x)
- Ruby
    - Compass: 'gem install compass'

Notes:
 - It minifies javascript files, unless they have '.min.' in the filename.
 - It compiles SCSS into CSS and minifies
 - It encodes any referenced images as base64 and includes them in the CSS
 - It includes files in order of their filename into 'template.html':
    - {% insert: js %} (any files in build/ ending in .js)
    - {% insert: css %} (the compiled results of build/sass)
    - {% insert: data %} (any existing build/data.json, or a placeholder if none)

"""

import os
import hashlib
import json
import re
import logging
import argparse
import subprocess

import build
from contrib.jsmin import jsmin
from contrib.cssmin import cssmin

globals()['WORKING'] = False
BUILD_DIR = build.module_dir()
SCRIPT_DIR = build.module_parent()

logger = logging.getLogger('bluebutton')
logger.setLevel(getattr(logging, 'INFO'))
logger_handler = logging.StreamHandler()
logger_handler.setLevel(logging.DEBUG)
logger.addHandler(logger_handler)


def build_project():
    if not globals()['WORKING']:
        globals()['WORKING'] = True
        logger.debug("Checking for changes to project files.")
        hashes = build_hashes()
        # if compare_hashes(hashes):
        if False:
            logger.debug("- No changes to files")
        else:
            write_hashes(hashes)
            output = inject_scripts()
            output = inject_styles(output)
            output = inject_data(output)
            write_output(output)
    else:
        logger.debug("Currently working, so skipping this build.")


def build_hashes():
    logger.debug("Building hashes")

    hashes = []

    # Find files in the build directory to compare
    for dirname, dirnames, filenames in os.walk(BUILD_DIR):
        for filename in filenames:
            if filename.split('.')[-1] in ['css', 'js', 'jpg', 'png', 'gif']:
                path = os.path.join(dirname, filename)
                useful_name = path.partition(BUILD_DIR)[2].strip("/")
                working_file = open(path)
                md5_hash = md5_for_file(open(path))
                working_file.close()
                hashes.append({"filename": useful_name, "hash": md5_hash})

    # Check the template file
    template_file = open(BUILD_DIR + "/template.html")
    hashes.append({"filename": 'template.html', "hash": md5_for_file(template_file)})
    template_file.close()

    try:
        # Check the data file
        data_file = open(BUILD_DIR + "/data.json")
        hashes.append({"filename": 'data.json', "hash": md5_for_file(data_file)})
        template_file.close()
    except IOError:
        pass

    return hashes


def compare_hashes(hashes):
    """
    Returns True if all known files have identical hashes, False if not
    """
    logger.debug("Comparing hashes")

    try:
        file_hashes = open(BUILD_DIR + "/file-hashes.json", "r")
    except IOError:
        logger.info("No hashes file found (build/file-hashes.json). Creating one.")
        return False

    try:
        stored_hashes = json.loads(file_hashes.read())
    except ValueError:
        logger.warning("Hashes file is invalid. Rebuilding.")
        return False

    # Compare stored hashes against new hashes
    for h in hashes:
        found = False
        for s in stored_hashes:
            if s['filename'] == h['filename']:
                if s['hash'] != h['hash']:
                    logger.info("Found a change to %s. Rebuilding." % (h['filename']))
                    return False
                else:
                    logger.debug("No change: %s" % (h['filename']))
                    found = True
        if not found:
            logger.info("Found a new file: %s. Rebuilding." % (h['filename']))
            return False

    file_hashes.close()
    return True


def write_hashes(hashes):
    logger.debug("Writing hashes")

    file_hashes = open(BUILD_DIR + "/file-hashes.json", "w")
    output = json.dumps(hashes, indent=4, separators=(',', ': '))
    file_hashes.write(output)
    file_hashes.close()

    return True


def inject_scripts(input=None):
    logger.info("> Injecting scripts")
    scripts_tag = r'([^\S\n]*){%\s?insert:\s?scripts\s?%}'
    scripts = []

    for dirname, dirnames, filenames in os.walk(BUILD_DIR + "/js"):
        for filename in filenames:
            if filename.split('.')[-1] == 'js':
                path = os.path.join(dirname, filename)
                scripts.append(path)

    if not input:
        logger.debug("- Fetching the template.")
        try:
            template_file = open(BUILD_DIR + "/template.html", "r")
            input = template_file.read()
        except IOError:
            raise TemplateError("Template file could not be opened")

    while re.search(scripts_tag, input, flags=re.IGNORECASE):
        tag = re.search(scripts_tag, input, flags=re.IGNORECASE)
        begin, end, whitespace = (tag.start(), tag.end(), tag.group(1))
        script_data = ""

        for script in scripts:
            logger.debug("- Adding %s to script data" % (script))
            useful_name = script.partition(BUILD_DIR)[2].strip("/")
            data = open(script).read()
            if not re.search(r'\.min\.', useful_name, flags=re.IGNORECASE):
                data = jsmin(data)
            script_data += "%s/* %s */ %s" % (whitespace, useful_name, data)

        script_data = "%s<!-- Injected scripts -->\n%s<script>\n%s\n%s</script>" % (whitespace, whitespace, script_data, whitespace)
        input = input[:begin] + script_data + input[end:]

    return input


def inject_styles(input=None):
    logger.info("> Injecting styles")
    styles_tag = r'([^\S\n]*){%\s?insert:\s?styles\s?%}'
    stylesheets = []

    # Run compass to compile any SCSS
    os.chdir(BUILD_DIR)
    subprocess.call(['compass', 'compile', '-q'])
    os.chdir(SCRIPT_DIR)

    for dirname, dirnames, filenames in os.walk(BUILD_DIR + "/stylesheets"):
        for filename in filenames:
            if filename.split('.')[-1] == 'css':
                path = os.path.join(dirname, filename)
                stylesheets.append(path)

    if not input:
        logger.debug("- Fetching the template.")
        try:
            template_file = open(BUILD_DIR + "/template.html", "r")
            input = template_file.read()
        except IOError:
            raise TemplateError("Template file could not be opened")

    while re.search(styles_tag, input, flags=re.IGNORECASE):
        tag = re.search(styles_tag, input, flags=re.IGNORECASE)
        begin, end, whitespace = (tag.start(), tag.end(), tag.group(1))
        styles_data = ""

        for sheet in stylesheets:
            logger.debug("- Adding %s to styles data" % (sheet))
            useful_name = sheet.partition(BUILD_DIR)[2].strip("/")
            data = open(sheet).read()
            if not re.search(r'\.min\.', useful_name, flags=re.IGNORECASE):
                data = cssmin(data)
            styles_data += "%s/* %s */ %s\n" % (whitespace, useful_name, data)

        styles_data = "%s<!-- Injected styles -->\n%s<style>\n%s\n%s</style>" % (whitespace, whitespace, styles_data, whitespace)
        input = input[:begin] + styles_data + input[end:]

    return input


def inject_data(input=None, placeholder=False):
    logger.info("> Injecting data")
    data_tag = r'([^\S\n]*){%\s?insert:\s?data\s?%}'

    if not placeholder:
        try:
            data_file = open(BUILD_DIR + "/data.json", "r")
            data = data_file.read()
            try:
                data = json.loads(data)
                data = json.dumps(data)
            except:
                raise DataError("Data file is not proper JSON")
        except IOError:
            logger.info("- No data file found (build/data.json). Using placeholder.")
            placeholder = True

    if not input:
        logger.debug("- Fetching the template.")
        try:
            template_file = open(BUILD_DIR + "/template.html", "r")
            input = template_file.read()
        except IOError:
            raise TemplateError("Template file could not be opened")

    while re.search(data_tag, input, flags=re.IGNORECASE):
        tag = re.search(data_tag, input, flags=re.IGNORECASE)
        begin = tag.start()
        end = tag.end()
        whitespace = tag.group(1)
        if not placeholder:
            data = "%s<!-- Injected patient data -->\n%s<script>BlueButtonCallback(%s)</script>" % (whitespace, whitespace, data)
            input = input[:begin] + data + input[end:]
        else:
            logger.debug("- Writing placeholder.")
            placeholder_text = "%s<script>\n%s\t// PUT PATIENT DATA (JSON) HERE\n%s</script>" % (whitespace, whitespace, whitespace)
            input = input[:begin] + placeholder_text + input[end:]

    return input


def write_output(output):
    target_file = open(SCRIPT_DIR + "/bluebutton.html", "w")
    target_file.write(output)
    target_file.close()

    logger.info("< Written successfully to bluebutton.html")


def md5_for_file(f, block_size=1000000):
    md5 = hashlib.md5()
    while True:
        data = f.read(block_size)
        if not data:
            break
        md5.update(data)
    return md5.hexdigest()


class TemplateError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)


class DataError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-v', '--verbose', action='store_true')
    parser.add_argument('-w', '--watch', action='store_true')
    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(getattr(logging, 'DEBUG'))

    if not args.watch:
        logger.info("Building the project...")
        build_project()
    else:
        # TODO
        # print ">>> Monitoring for changes to project files. Press Ctrl-C to stop."
        print "Watching is not yet implemented"
