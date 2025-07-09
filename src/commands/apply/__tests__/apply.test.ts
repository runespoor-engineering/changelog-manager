import { execSync } from "node:child_process";
import fs from "node:fs";
import type { MockedFunction } from "vitest";
import { ChangesTypes } from "../../../types/common";
import { getDateFromChangeFileName } from "../../../utils/changeFileMeta/getDateFromChangeFileName/getDateFromChangeFileName";
import { getChangeFileData } from "../../../utils/filesData/getChangeFileData";
import { getChangeFilesPaths } from "../../../utils/filesData/getChangeFilesPaths";
import { getPackageJsonData } from "../../../utils/filesData/getPackageJsonData";
import { createChangelogJsonFile } from "../../../utils/filesOperations/createChangelogJsonFile";
import { createChangelogTextFile } from "../../../utils/filesOperations/createChangelogTextFile";
import { modifyChangelog } from "../../../utils/filesOperations/modifyChangelog";
import { modifyPackageVersion } from "../../../utils/filesOperations/modifyPackageVersion";
import { GIT_COMMANDS } from "../../../utils/git/command";
import { getChangelogJsonFilePath } from "../../../utils/paths/getChangelogJsonFilePath";
import { getChangelogTextFilePath } from "../../../utils/paths/getChangelogTextFilePath";
import { getPackageJsonFilePath } from "../../../utils/paths/getPackageJsonFilePath";
import { bumpSemver } from "../../../utils/semver/bumpSemver";
import { apply } from "../apply";

// Mock all external dependencies
vi.mock("node:child_process");
vi.mock("node:fs");
vi.mock(
	"../../utils/changeFileMeta/getDateFromChangeFileName/getDateFromChangeFileName",
);
vi.mock("../../utils/filesData/getChangeFileData");
vi.mock("../../utils/filesData/getChangeFilesPaths");
vi.mock("../../utils/filesData/getPackageJsonData");
vi.mock("../../utils/filesOperations/createChangelogJsonFile");
vi.mock("../../utils/filesOperations/createChangelogTextFile");
vi.mock("../../utils/filesOperations/modifyChangelog");
vi.mock("../../utils/filesOperations/modifyPackageVersion");
vi.mock("../../utils/paths/getChangelogJsonFilePath");
vi.mock("../../utils/paths/getChangelogTextFilePath");
vi.mock("../../utils/paths/getPackageJsonFilePath");
vi.mock("../../utils/semver/bumpSemver");

const mockExecSync = execSync as MockedFunction<typeof execSync>;
const mockFs = fs as any;
const mockGetDateFromChangeFileName =
	getDateFromChangeFileName as MockedFunction<typeof getDateFromChangeFileName>;
const mockGetChangeFileData = getChangeFileData as MockedFunction<
	typeof getChangeFileData
>;
const mockGetChangeFilesPaths = getChangeFilesPaths as MockedFunction<
	typeof getChangeFilesPaths
>;
const mockGetPackageJsonData = getPackageJsonData as MockedFunction<
	typeof getPackageJsonData
>;
const mockCreateChangelogJsonFile = createChangelogJsonFile as MockedFunction<
	typeof createChangelogJsonFile
>;
const mockCreateChangelogTextFile = createChangelogTextFile as MockedFunction<
	typeof createChangelogTextFile
>;
const mockModifyChangelog = modifyChangelog as MockedFunction<
	typeof modifyChangelog
>;
const mockModifyPackageVersion = modifyPackageVersion as MockedFunction<
	typeof modifyPackageVersion
>;
const mockGetChangelogJsonFilePath = getChangelogJsonFilePath as MockedFunction<
	typeof getChangelogJsonFilePath
>;
const mockGetChangelogTextFilePath = getChangelogTextFilePath as MockedFunction<
	typeof getChangelogTextFilePath
>;
const mockGetPackageJsonFilePath = getPackageJsonFilePath as MockedFunction<
	typeof getPackageJsonFilePath
>;
const mockBumpSemver = bumpSemver as MockedFunction<typeof bumpSemver>;

describe("apply", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mocks
		mockExecSync.mockReturnValue(Buffer.from("main"));
		mockGetPackageJsonData.mockReturnValue({ version: "1.0.0" });
		mockGetChangelogJsonFilePath.mockReturnValue("changelog.json");
		mockGetChangelogTextFilePath.mockReturnValue("CHANGELOG.md");
		mockGetPackageJsonFilePath.mockReturnValue("package.json");
	});

	it("should return early when no change files exist", async () => {
		expect.hasAssertions();

		mockGetChangeFilesPaths.mockReturnValue([]);

		await apply();

		expect(mockCreateChangelogTextFile).toHaveBeenCalled();
		expect(mockCreateChangelogJsonFile).toHaveBeenCalled();
		expect(mockModifyChangelog).not.toHaveBeenCalled();
		expect(mockModifyPackageVersion).not.toHaveBeenCalled();
	});

	it("should accumulate multiple change files and determine highest change type", async () => {
		expect.hasAssertions();

		const changeFiles = [
			"/path/to/change1.json",
			"/path/to/change2.json",
			"/path/to/change3.json",
		];

		const date1 = new Date("2023-01-01");
		const date2 = new Date("2023-01-02");
		const date3 = new Date("2023-01-03");

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);

		// Mock for sorting phase
		mockGetDateFromChangeFileName
			.mockReturnValueOnce(date1)
			.mockReturnValueOnce(date2)
			.mockReturnValueOnce(date3)
			// Mock for data collection phase (in sorted order: newest first)
			.mockReturnValueOnce(date3)
			.mockReturnValueOnce(date2)
			.mockReturnValueOnce(date1);

		mockGetChangeFileData
			.mockReturnValueOnce({
				type: ChangesTypes.Minor,
				comment: "Add feature",
				author: "Author1",
				issueLinks: ["link4"],
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Major,
				comment: "Breaking change",
				author: "Author2",
				issueLinks: ["link2", "link3"],
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "Fix bug 1",
				author: "Author1",
				issueLinks: ["link1", "link2"],
			});

		mockBumpSemver.mockReturnValue("2.0.0");

		await apply();

		expect(mockBumpSemver).toHaveBeenCalledWith("1.0.0", ChangesTypes.Major);
		expect(mockModifyChangelog).toHaveBeenCalledWith({
			bumpedPackageVersion: "2.0.0",
			date: date3, // Latest date
			changesType: ChangesTypes.Major, // Highest change type
			comment: "Add feature\n\nBreaking change\n\nFix bug 1", // Sorted by date (newest first)
			author: "Author1, Author2", // Unique authors
			issueLinks: ["link4", "link2", "link3", "link1"], // Unique issue links
			changelogFileLocation: "CHANGELOG",
		});
	});

	it("should sort change files by date correctly (newest first)", async () => {
		expect.hasAssertions();

		const changeFiles = [
			"/path/to/old-change.json",
			"/path/to/new-change.json",
			"/path/to/middle-change.json",
		];

		const oldDate = new Date("2023-01-01");
		const newDate = new Date("2023-01-03");
		const middleDate = new Date("2023-01-02");

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);

		// Mock for sorting phase
		mockGetDateFromChangeFileName
			.mockReturnValueOnce(oldDate)
			.mockReturnValueOnce(newDate)
			.mockReturnValueOnce(middleDate)
			// Mock for data collection phase (in sorted order)
			.mockReturnValueOnce(newDate)
			.mockReturnValueOnce(middleDate)
			.mockReturnValueOnce(oldDate);

		mockGetChangeFileData
			.mockReturnValueOnce({
				type: ChangesTypes.Minor,
				comment: "Newest change",
				author: "Author1",
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "Middle change",
				author: "Author2",
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "Oldest change",
				author: "Author3",
			});

		mockBumpSemver.mockReturnValue("1.1.0");

		await apply();

		expect(mockModifyChangelog).toHaveBeenCalledWith(
			expect.objectContaining({
				comment: "Newest change\n\nMiddle change\n\nOldest change",
				date: newDate,
			}),
		);
	});

	it("should handle change files without dates", async () => {
		expect.hasAssertions();

		const changeFiles = ["/path/to/change1.json", "/path/to/change2.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);

		// Mock for sorting phase
		mockGetDateFromChangeFileName
			.mockReturnValueOnce(null)
			.mockReturnValueOnce(new Date("2023-01-01"))
			// Mock for data collection phase
			.mockReturnValueOnce(new Date("2023-01-01"))
			.mockReturnValueOnce(null);

		mockGetChangeFileData
			.mockReturnValueOnce({
				type: ChangesTypes.Minor,
				comment: "Change with date",
				author: "Author2",
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "Change without date",
				author: "Author1",
			});

		mockBumpSemver.mockReturnValue("1.1.0");

		await apply();

		expect(mockModifyChangelog).toHaveBeenCalledWith(
			expect.objectContaining({
				changesType: ChangesTypes.Minor,
				date: new Date("2023-01-01"),
			}),
		);
	});

	it("should handle change files without issue links", async () => {
		expect.hasAssertions();

		const changeFiles = ["/path/to/change1.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);
		mockGetDateFromChangeFileName
			.mockReturnValueOnce(new Date("2023-01-01"))
			.mockReturnValueOnce(new Date("2023-01-01"));

		mockGetChangeFileData.mockReturnValue({
			type: ChangesTypes.Patch,
			comment: "Fix without issues",
			author: "Author1",
		});

		mockBumpSemver.mockReturnValue("1.0.1");

		await apply();

		expect(mockModifyChangelog).toHaveBeenCalledWith(
			expect.objectContaining({
				issueLinks: undefined,
			}),
		);
	});

	it("should exit with error when version bump fails", async () => {
		expect.hasAssertions();

		const originalExit = process.exit;
		const mockExit = vi.fn();
		process.exit = mockExit as any;

		const changeFiles = ["/path/to/change1.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);
		mockGetDateFromChangeFileName
			.mockReturnValueOnce(new Date("2023-01-01"))
			.mockReturnValueOnce(new Date("2023-01-01"));

		mockGetChangeFileData.mockReturnValue({
			type: ChangesTypes.Patch,
			comment: "Fix",
			author: "Author1",
		});

		mockBumpSemver.mockReturnValue(null);

		await apply();

		expect(mockExit).toHaveBeenCalledWith(1);

		process.exit = originalExit;
	});

	it("should delete all change files and commit changes", async () => {
		expect.hasAssertions();

		const changeFiles = ["/path/to/change1.json", "/path/to/change2.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);
		mockGetDateFromChangeFileName.mockReturnValue(new Date("2023-01-01"));

		mockGetChangeFileData.mockReturnValue({
			type: ChangesTypes.Patch,
			comment: "Fix",
			author: "Author1",
		});

		mockBumpSemver.mockReturnValue("1.0.1");

		await apply();

		// Verify files are deleted
		expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
		expect(mockFs.unlinkSync).toHaveBeenCalledWith("/path/to/change1.json");
		expect(mockFs.unlinkSync).toHaveBeenCalledWith("/path/to/change2.json");

		// Verify git operations
		expect(mockExecSync).toHaveBeenCalledWith(
			GIT_COMMANDS.add("/path/to/change1.json"),
		);
		expect(mockExecSync).toHaveBeenCalledWith(
			GIT_COMMANDS.add("/path/to/change2.json"),
		);
		expect(mockExecSync).toHaveBeenCalledWith(GIT_COMMANDS.add("package.json"));
		expect(mockExecSync).toHaveBeenCalledWith(GIT_COMMANDS.add("CHANGELOG.md"));
		expect(mockExecSync).toHaveBeenCalledWith(
			GIT_COMMANDS.add("changelog.json"),
		);
		expect(mockExecSync).toHaveBeenCalledWith(
			GIT_COMMANDS.commit("chore(changelog): apply change file [ci skip]"),
		);
		expect(mockExecSync).toHaveBeenCalledWith(
			GIT_COMMANDS.push("origin", "main"),
		);

		// Verify package version is updated
		expect(mockModifyPackageVersion).toHaveBeenCalledWith("1.0.1");
	});

	it("should respect custom options", async () => {
		expect.hasAssertions();

		const options = {
			targetBranch: "develop",
			remoteName: "upstream",
			location: "custom-changes",
			changelogFileLocation: "custom-changelog",
		};

		mockGetChangeFilesPaths.mockReturnValue([]);

		await apply(options);

		expect(mockGetChangeFilesPaths).toHaveBeenCalledWith("custom-changes");
		expect(mockCreateChangelogTextFile).toHaveBeenCalledWith(
			"custom-changelog",
		);
		expect(mockCreateChangelogJsonFile).toHaveBeenCalledWith(
			"custom-changelog",
		);
	});

	it("should handle change type priority correctly", async () => {
		expect.hasAssertions();

		const changeFiles = ["/path/to/change1.json", "/path/to/change2.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);
		mockGetDateFromChangeFileName.mockReturnValue(new Date("2023-01-01"));

		// Test that Major beats Minor
		mockGetChangeFileData
			.mockReturnValueOnce({
				type: ChangesTypes.Minor,
				comment: "Minor change",
				author: "Author1",
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Major,
				comment: "Major change",
				author: "Author2",
			});

		mockBumpSemver.mockReturnValue("2.0.0");

		await apply();

		expect(mockBumpSemver).toHaveBeenCalledWith("1.0.0", ChangesTypes.Major);
		expect(mockModifyChangelog).toHaveBeenCalledWith(
			expect.objectContaining({
				changesType: ChangesTypes.Major,
			}),
		);
	});

	it("should handle duplicate authors and issue links correctly", async () => {
		expect.hasAssertions();

		const changeFiles = ["/path/to/change1.json", "/path/to/change2.json"];

		mockGetChangeFilesPaths.mockReturnValue(changeFiles);
		mockGetDateFromChangeFileName.mockReturnValue(new Date("2023-01-01"));

		mockGetChangeFileData
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "First change",
				author: "Author1",
				issueLinks: ["link1", "link2"],
			})
			.mockReturnValueOnce({
				type: ChangesTypes.Patch,
				comment: "Second change",
				author: "Author1", // Duplicate author
				issueLinks: ["link2", "link3"], // link2 is duplicate
			});

		mockBumpSemver.mockReturnValue("1.0.1");

		await apply();

		expect(mockModifyChangelog).toHaveBeenCalledWith(
			expect.objectContaining({
				author: "Author1", // Should only appear once
				issueLinks: ["link1", "link2", "link3"], // Should be unique
			}),
		);
	});
});
