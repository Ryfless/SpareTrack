# SparePart Management System - Frontend Improvement

## Objective

Improve the current frontend of the SparePart Management System into a modern enterprise-level application.

The current project already has a dashboard, inventory, reports, and settings.
Do NOT redesign everything.
Maintain the existing design language, color palette, spacing, typography, and component style.

The goal is to make the application feel similar to modern ERP systems (SAP Fiori, Odoo, Oracle NetSuite, Microsoft Dynamics, Linear, Notion, Vercel Dashboard).

Only modify and extend the existing frontend.

Backend integration is NOT required.

---

# General Rules

- Keep current color palette.
- Keep existing components whenever possible.
- Use React + TypeScript.
- Keep responsive layout.
- Support desktop first.
- Mobile adaptation is enough.
- Use reusable components.
- Avoid duplicated code.
- Improve accessibility.
- Smooth transitions (150-250ms).
- Use loading skeleton instead of blank loading.
- Use empty states.
- Use toast notification placeholders.
- Do not implement backend logic.
- Mock data is acceptable.

---

# 1 Dashboard Improvements

Transform dashboard into an operational control center instead of only statistics.

## Add Action Center

At the top of dashboard add cards showing:

- Critical stock alerts
- Pending approvals
- Low stock items
- Delayed supplier delivery
- Branches with stock issues

Each card should have:

- Icon
- Color
- Count
- Short description
- Click interaction

---

## Add Quick Actions

Below Action Center add shortcut buttons.

Example:

+ Add Spare Part

+ Stock In

+ Transfer Stock

+ Create Purchase Request

+ Add Supplier

+ Add Branch

Large rounded buttons with icon.

---

## Recent Activities Panel

Add activity timeline.

Example:

10:30
Admin added new spare part

09:40
Stock transferred

Yesterday
Supplier updated price

This panel should always stay visible.

---

## Inventory Health Widget

Visualize inventory condition using progress bars.

Example

Healthy Stock

█████████

Low Stock

████

Critical

█

---

## Branch Performance Widget

Show branch comparison.

Example

Jakarta

95%

Bogor

74%

Bandung

88%

Using horizontal bars.

---

## KPI Improvements

Current KPI cards should include:

trend

percentage

mini sparkline

comparison with previous period

---

# 2 Inventory Page

Improve usability.

## Advanced Filters

Add filters:

Category

Supplier

Branch

Stock Status

Price

Date

Sort

Search

Filters should be collapsible.

---

## Inventory Cards

Hover animation

Status badge

Stock progress bar

Quick menu

Favorite

Image preview

---

## Detail Drawer

Clicking an item should open a side drawer.

Contains:

Image

Basic Information

Stock History

Movement History

Supplier

Forecast

Related Branches

Notes

No page reload.

---

## Bulk Actions

Support selecting multiple rows.

Toolbar appears:

Delete

Export

Transfer

Print QR

---

# 3 Tables

Improve every table.

Sticky header

Resizable columns

Column visibility

Sorting

Pagination

Search

Row hover

Right click menu

Density selector

---

# 4 Empty States

Create beautiful empty states.

Illustration

Title

Description

Action button

Different empty states for:

Inventory

Supplier

Reports

Notifications

Search

---

# 5 Loading

Replace all loading with skeleton components.

Dashboard

Cards

Tables

Charts

Detail Drawer

---

# 6 Notifications

Create notification center.

Grouped by:

Today

Yesterday

Older

Unread indicator

Mark all read

Filter

Search

---

# 7 Search Experience

Global search should search:

Inventory

Supplier

Branch

Reports

Settings

Recent pages

Keyboard shortcut:

CTRL + K

Open command palette.

---

# 8 Settings

Split settings into categories.

General

Appearance

Notifications

Security

Users

Roles

System

Audit Logs

About

---

# 9 Profile Menu

Improve user profile dropdown.

Avatar

Role

Branch

Dark mode

Profile

Security

Logout

---

# 10 Sidebar Improvements

Organize menu using sections.

MAIN

Dashboard

Analytics

OPERATIONS

Inventory

Supplier

Branches

REPORTS

Reports

Forecast

SYSTEM

Users

Roles

Settings

Collapse animation.

---

# 11 Better Status Components

Create reusable status chips.

Safe

Warning

Critical

Pending

Approved

Rejected

Delivered

Completed

Each with:

color

icon

tooltip

---

# 12 Landing Page

Create a modern landing page before login.

Style:

Modern SaaS

Enterprise

Minimal

Premium

Responsive

Hero section:

Large headline

Short description

CTA buttons

Illustration related to inventory and warehouse

Navbar:

Features

About

Pricing (placeholder)

Contact

Login

Register

Sections:

Hero

Features

Statistics

Workflow

Testimonials (dummy)

FAQ

Footer

Animations should be subtle.

---

# 13 Authentication UI

Create complete authentication frontend.

Pages:

Login

Register

Forgot Password

Reset Password

Verify OTP

Success

Email Sent

404

403

401

Session Expired

---

## Login

Support:

Email

Password

Remember me

Show password

Login button

Continue with Google

Forgot Password

Register

---

## Register

Fields:

Full Name

Email

Phone

Password

Confirm Password

Branch (optional)

Checkbox agreement

Create Account

Google Sign Up

---

## Forgot Password

Email input

Send OTP button

Success message

---

## OTP Verification

Beautiful OTP page.

6 input boxes.

Countdown timer.

Resend OTP.

Paste support.

Auto focus.

---

## Reset Password

New Password

Confirm Password

Password strength meter

Requirements checklist

Success screen

---

# 14 Authentication Layout

Split layout.

Left:

Illustration

Marketing text

Right:

Form

Card

Glass effect

Responsive

---

# 15 RBAC UI

Prepare frontend for Role Based Access Control.

Roles:

Super Admin

Branch Admin

Create mock permission system.

Super Admin:

Dashboard

Inventory

Supplier

Users

Roles

Branches

Reports

Settings

Audit Log

System

Branch Admin:

Dashboard

Inventory

Branch Inventory

Purchase Requests

Reports

Profile

Hide inaccessible menus automatically.

Do NOT show disabled menu.

---

# 16 User Management UI

Create pages:

User List

Create User

Edit User

Role Assignment

Permission Preview

Status

Activity

Branch Assignment

---

# 17 Audit Log UI

Timeline

User

Action

Time

Module

IP

Search

Filter

Export

---

# 18 Security UI

Pages:

Change Password

Sessions

Devices

Login History

2FA Placeholder

API Tokens Placeholder

---

# 19 Theme Support

Prepare Light Mode

Dark Mode

System Mode

Persist preference.

---

# 20 Reusable Components

Create reusable components:

PageHeader

StatCard

EmptyState

LoadingSkeleton

StatusBadge

ActionCard

QuickAction

Timeline

MetricCard

Drawer

Modal

CommandPalette

SearchInput

RoleBadge

NotificationCard

ActivityCard

SectionTitle

---

# Design Philosophy

The application should feel like a premium enterprise SaaS product.

Visual keywords:

Clean

Modern

Minimal

Professional

Trustworthy

Fast

Data-driven

Comfortable spacing

Rounded corners

Soft shadows

Consistent typography

Excellent hierarchy

The user should immediately understand where to click and what action to take.

Do NOT overuse colors.

Use whitespace effectively.

Keep interactions smooth and intuitive.

Maintain the existing design language while significantly improving usability and information hierarchy.