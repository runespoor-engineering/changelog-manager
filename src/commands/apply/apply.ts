import { execSync } from "node:child_process";
import fs from "node:fs";

import {
	DEFAULT_CHANGE_FILES_LOCATION,
	DEFAULT_CHANGELOG_FILE_LOCATION,
	DEFAULT_GIT_REMOTE_NAME,
} from "../../constants/common";
import { ERRORS } from "../../constants/errorMessages";
import type { ChangesTypes } from "../../types/common";
import { getDateFromChangeFileName } from "../../utils/changeFileMeta/getDateFromChangeFileName/getDateFromChangeFileName";
import { getChangeFileData } from "../../utils/filesData/getChangeFileData";
import { getChangeFilesPaths } from "../../utils/filesData/getChangeFilesPaths";
import { getPackageJsonData } from "../../utils/filesData/getPackageJsonData";
import { createChangelogJsonFile } from "../../utils/filesOperations/createChangelogJsonFile";
import { createChangelogTextFile } from "../../utils/filesOperations/createChangelogTextFile";
import { modifyChangelog } from "../../utils/filesOperations/modifyChangelog";
import { modifyPackageVersion } from "../../utils/filesOperations/modifyPackageVersion";
import { GIT_COMMANDS } from "../../utils/git/command";
import { getChangelogJsonFilePath } from "../../utils/paths/getChangelogJsonFilePath";
import { getChangelogTextFilePath } from "../../utils/paths/getChangelogTextFilePath";
import { getPackageJsonFilePath } from "../../utils/paths/getPackageJsonFilePath";
import { bumpSemver } from "../../utils/semver/bumpSemver";

// Helper function to determine the highest change type
const getHighestChangeType = (types: ChangesTypes[]): ChangesTypes => {
	const hierarchy = {
		major: 3,
		minor: 2,
		patch: 1,
		none: 0,
	};

	return types.reduce((highest, current) =>
		hierarchy[current] > hierarchy[highest] ? current : highest,
	);
};

export const apply = async (options?: {
	targetBranch?: string;
	remoteName?: string;
	location?: string;
	changelogFileLocation?: string;
}) => {
	const changeFilesLocation =
		options?.location || DEFAULT_CHANGE_FILES_LOCATION;
	const changelogFileLocation =
		options?.changelogFileLocation || DEFAULT_CHANGELOG_FILE_LOCATION;
	const remote = options?.remoteName || DEFAULT_GIT_REMOTE_NAME;
	const targetBranch =
		options?.targetBranch ||
		execSync(GIT_COMMANDS.defaultBranchName(remote)).toString().trim();

	createChangelogTextFile(changelogFileLocation);
	createChangelogJsonFile(changelogFileLocation);

	const packageJsonData = getPackageJsonData();
	const changeFilesPaths = getChangeFilesPaths(changeFilesLocation);

	if (changeFilesPaths.length === 0) {
		return;
	}

	// Accumulate all change data
	const allAuthors = new Set<string>();
	const allIssueLinks = new Set<string>();
	const allChangeTypes: ChangesTypes[] = [];
	const allComments: string[] = [];
	const allDates: Date[] = [];

	// Sort change files by date (newest first) to ensure correct comment ordering
	const sortedChangeFilesPaths = changeFilesPaths
		.map((changeFilePath) => ({
			path: changeFilePath,
			date: getDateFromChangeFileName(changeFilePath),
		}))
		.sort((a, b) => {
			if (!a.date && !b.date) return 0;
			if (!a.date) return 1;
			if (!b.date) return -1;
			return b.date.getTime() - a.date.getTime(); // Newest first
		})
		.map((item) => item.path);

	// Collect data from all change files (now in date order)
	sortedChangeFilesPaths.forEach((changeFilePath) => {
		const changeFileDate = getDateFromChangeFileName(changeFilePath);
		const changeFileData = getChangeFileData(changeFilePath);

		allAuthors.add(changeFileData.author);
		allChangeTypes.push(changeFileData.type);
		allComments.push(changeFileData.comment);

		if (changeFileDate) {
			allDates.push(changeFileDate);
		}

		if (changeFileData.issueLinks) {
			changeFileData.issueLinks.forEach((link) => allIssueLinks.add(link));
		}
	});

	// Determine accumulated values
	const highestChangeType = getHighestChangeType(allChangeTypes);
	const uniqueAuthors = Array.from(allAuthors).join(", ");
	const uniqueIssueLinks = Array.from(allIssueLinks);
	const latestDate =
		allDates.length > 0
			? new Date(Math.max(...allDates.map((d) => d.getTime())))
			: new Date();
	const combinedComment = allComments.join("\n\n");

	// Bump version only once based on the highest change type
	const bumpedPackageVersion = bumpSemver(
		packageJsonData.version,
		highestChangeType,
	);

	if (!bumpedPackageVersion) {
		console.error(ERRORS.bumpVersion());
		process.exit(1);
	}

	// Apply changelog with accumulated data
	modifyChangelog({
		bumpedPackageVersion,
		date: latestDate,
		changesType: highestChangeType,
		comment: combinedComment,
		author: uniqueAuthors,
		issueLinks: uniqueIssueLinks.length > 0 ? uniqueIssueLinks : undefined,
		changelogFileLocation,
	});

	// Delete all change files and add them to git
	sortedChangeFilesPaths.forEach((changeFilePath) => {
		fs.unlinkSync(changeFilePath);
		execSync(GIT_COMMANDS.add(changeFilePath));
	});

	// Update package version and commit all changes
	modifyPackageVersion(bumpedPackageVersion);
	execSync(GIT_COMMANDS.add(getPackageJsonFilePath()));
	execSync(GIT_COMMANDS.add(getChangelogTextFilePath(changelogFileLocation)));
	execSync(GIT_COMMANDS.add(getChangelogJsonFilePath(changelogFileLocation)));
	execSync(
		GIT_COMMANDS.commit(`chore(changelog): apply change file [ci skip]`),
	);
	execSync(GIT_COMMANDS.push(remote, targetBranch));
};
