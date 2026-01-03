using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRepairJobStatusFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "RepairJobs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsReturnedToCustomer",
                table: "RepairJobs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnedAt",
                table: "RepairJobs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "RepairJobs",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "RepairJobs");

            migrationBuilder.DropColumn(
                name: "IsReturnedToCustomer",
                table: "RepairJobs");

            migrationBuilder.DropColumn(
                name: "ReturnedAt",
                table: "RepairJobs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RepairJobs");
        }
    }
}
